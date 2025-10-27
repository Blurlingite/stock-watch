import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import {UpdateResult} from "mongoose";
import {ObjectId} from "mongodb";
import {Watchlist} from "@/database/models/watchlist.model";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getDateRange = (days: number) => {
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(toDate.getDate() - days);
    return {
        to: toDate.toISOString().split('T')[0],
        from: fromDate.toISOString().split('T')[0],
    };
};

// Check for required article fields
export const validateArticle = (article: RawNewsArticle) =>
    article.headline && article.summary && article.url && article.datetime;

export const formatArticle = (
    article: RawNewsArticle,
    isCompanyNews: boolean,
    symbol?: string,
    index: number = 0
) => ({
    id: isCompanyNews ? Date.now() + Math.random() : article.id + index,
    headline: article.headline!.trim(),
    summary:
        article.summary!.trim().substring(0, isCompanyNews ? 200 : 150) + '...',
    source: article.source || (isCompanyNews ? 'Company News' : 'Market News'),
    url: article.url!,
    datetime: article.datetime!,
    image: article.image || '',
    category: isCompanyNews ? 'company' : article.category || 'general',
    related: isCompanyNews ? symbol! : article.related || '',
});

export const getFormattedTodayDate = () => new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
});

// Simple HTML escaper for email templates
export const escapeHtml = (input: string) =>
    input.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));



