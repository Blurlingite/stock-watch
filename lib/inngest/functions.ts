import { inngest } from "@/lib/inngest/client";
import { date, email } from "zod";
import {
  NEWS_SUMMARY_EMAIL_PROMPT,
  PERSONALIZED_WELCOME_EMAIL_PROMPT,
} from "@/lib/inngest/prompts";
import {
  sendMaxValueStockEmail,
  sendMinValueStockEmail,
  sendNewsSummaryEmail,
  sendWelcomeEmail,
} from "@/lib/nodemailer";
import {
  getAllUsersForNewsEmail,
  getUserById,
} from "@/lib/actions/user.actions";
import { getFormattedTodayDate } from "@/lib/utils";
import {
  getNews,
  getStockCompanyName,
  getStockPrice,
} from "@/lib/actions/finnhub.actions";
import {
  getAllWatchlists,
  getWatchlistSymbolsByEmail,
} from "@/lib/actions/watchlist.actions";

export const sendSignUpEmail = inngest.createFunction(
  { id: "sign-up-email" },
  { event: "app/user.created" },
  async ({ event, step }) => {
    const userProfile = `
            - Country: ${event.data.country}
            - Investment goals: ${event.data.investmentGoals}
            - Risk tolerance: ${event.data.riskTolerance}
            - Preferred industry: ${event.data.preferredIndustry}
        `;

    const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace(
      "{{userProfile}}",
      userProfile
    );

    const response = await step.ai.infer("generate-welcome-intro", {
      model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
      body: {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      },
    });

    await step.run("send-welcome-email", async () => {
      const part = response.candidates?.[0]?.content?.parts?.[0];
      const introText =
        (part && "text" in part ? part.text : null) ||
        "Thanks for joining Stock Watch. You now have the tools to track markets and make smarter moves.";

      const {
        data: { email, name },
      } = event;

      return await sendWelcomeEmail({ email, name, intro: introText });
    });

    return {
      success: true,
      message: "Welcome email sent successfully",
    };
  }
);

export const sendDailyNewsSummary = inngest.createFunction(
  { id: "daily-news-summary" },
  [{ event: "app/send.daily.news" }, { cron: "0 12 * * *" }],
  async ({ step }) => {
    // Step 1: get all users for news delivery
    const users = await step.run("get-all-users", getAllUsersForNewsEmail);

    if (!users || users.length === 0)
      return { success: false, message: "No users found for news email." };

    // Step 2: Fetch personalized news for each user
    const results = await step.run("fetch-user-news", async () => {
      const perUser: Array<{ user: User; articles: MarketNewsArticle[] }> = [];
      for (const user of users as User[]) {
        try {
          const symbols = await getWatchlistSymbolsByEmail(user.email);
          let articles = await getNews(symbols);
          // Enforce max 6 articles per user
          articles = (articles || []).slice(0, 6);
          // If still empty, fallback to general
          if (!articles || articles.length === 0) {
            articles = await getNews();
            articles = (articles || []).slice(0, 6);
          }
          perUser.push({ user, articles });
        } catch (e) {
          console.error("daily-news: error preparing user news", user.email, e);
          perUser.push({ user, articles: [] });
        }
      }
      return perUser;
    });

    // Step #3: (placeholder) Summarize news via AI
    const userNewsSummaries: { user: User; newsContent: string | null }[] = [];

    for (const { user, articles } of results) {
      try {
        const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace(
          "{{newsData}}",
          JSON.stringify(articles, null, 2)
        );

        const response = await step.ai.infer(`summarize-news-${user.email}`, {
          model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
          body: {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
          },
        });

        const part = response.candidates?.[0]?.content?.parts?.[0];
        const newsContent =
          (part && "text" in part ? part.text : null) || "No market news.";

        userNewsSummaries.push({ user, newsContent });
      } catch (e) {
        console.error("Failed to summarize news for : ", user.email);
        userNewsSummaries.push({ user, newsContent: null });
      }
    }

    // Step #4: Send the emails
    await step.run("send-news-emails", async () => {
      await Promise.all(
        userNewsSummaries.map(async ({ user, newsContent }) => {
          if (!newsContent) return false;

          return await sendNewsSummaryEmail({
            email: user.email,
            date: getFormattedTodayDate(),
            newsContent,
          });
        })
      );
    });

    return {
      success: true,
      message: "Daily news summary emails sent successfully",
    };
  }
);

export const sendWatchlistStockRangeEmail = inngest.createFunction(
  { id: "watchlist-stock-range" },
  [{ event: "app/send.watchlist.range" }, { cron: "*/30 * * * *" }],
  async ({ step }) => {
    // Step 1: Get all watchlists
    const watchlists = await step.run("get-all-watchlists", getAllWatchlists);

    if (!watchlists || watchlists.length === 0) {
      return {
        success: false,
        message: "No watchlists found for stock range email.",
      };
    }

    // Step 2: Loop, build the batch of alert emails to send
    const minValEmailsToSend: Array<{
      email: string;
      symbol: string;
      company: string;
      currentPrice: string;
      targetPrice: string;
      timestamp: string;
    }> = [];

    const maxValEmailsToSend: Array<{
      email: string;
      symbol: string;
      company: string;
      currentPrice: string;
      targetPrice: string;
      timestamp: string;
    }> = [];

    for (const watchlist of watchlists) {
      try {
        const { userId, symbol, minValue, maxValue } = watchlist;
        const stockPrice = await getStockPrice(symbol);

        const min = typeof minValue === "number" ? minValue : Number(minValue);
        const max = typeof maxValue === "number" ? maxValue : Number(maxValue);
        const hasMin = Number.isFinite(min);
        const hasMax = Number.isFinite(max);
        let stockPriceNum;

        if (!hasMin && !hasMax) continue;

        if (stockPrice.quote) {
          stockPriceNum = Number(stockPrice.quote.c);

          if (hasMin && stockPrice.quote && stockPriceNum <= min) {
            const user = await getUserById(userId);

            if (!user || !user.email) continue;

            // Format human-readable timestamp
            const now = new Date();
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const day = String(now.getDate()).padStart(2, "0");
            const year = now.getFullYear();
            let hours = now.getHours();
            const minutes = String(now.getMinutes()).padStart(2, "0");
            const ampm = hours >= 12 ? "PM" : "AM";
            hours = hours % 12;
            hours = hours ? hours : 12;
            const hourString = String(hours).padStart(2, "0");
            const timestamp = `${month}/${day}/${year} ${hourString}:${minutes} ${ampm}`;

            const company = await getStockCompanyName(symbol);
            const companyName = company?.companyName;

            minValEmailsToSend.push({
              email: user.email,
              symbol,
              company: companyName ?? "",
              currentPrice: stockPriceNum.toString(),
              targetPrice: min.toString(),
              timestamp,
            });
          } else if (stockPrice.quote && stockPriceNum >= maxValue) {
            const user = await getUserById(userId);

            if (!user || !user.email) continue;

            // Format human-readable timestamp
            const now = new Date();
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const day = String(now.getDate()).padStart(2, "0");
            const year = now.getFullYear();
            let hours = now.getHours();
            const minutes = String(now.getMinutes()).padStart(2, "0");
            const ampm = hours >= 12 ? "PM" : "AM";
            hours = hours % 12;
            hours = hours ? hours : 12;
            const hourString = String(hours).padStart(2, "0");
            const timestamp = `${month}/${day}/${year} ${hourString}:${minutes} ${ampm}`;

            const company = await getStockCompanyName(symbol);
            const companyName = company?.companyName;

            maxValEmailsToSend.push({
              email: user.email,
              symbol,
              company: companyName ?? "",
              currentPrice: stockPriceNum.toString(),
              targetPrice: max.toString(),
              timestamp,
            });
          }
        }
      } catch (error) {
        console.error(
          `Error processing watchlist for symbol ${watchlist.symbol}:`,
          error
        );
        continue;
      }
    }

    // Step 3: Send emails in parallel for all matched alerts
    await Promise.all(
      minValEmailsToSend.map((currentOpts) =>
        sendMinValueStockEmail(currentOpts)
      )
    );

    await Promise.all(
      maxValEmailsToSend.map((currentOpts) =>
        sendMaxValueStockEmail(currentOpts)
      )
    );

    const totalEmailsLength =
      minValEmailsToSend.length + maxValEmailsToSend.length;

    return {
      success: true,
      sent: totalEmailsLength,
      message: `Sent ${totalEmailsLength} watchlist alert emails.`,
    };
  }
);
