import React from 'react'
import Link from "next/link";
import Image from "next/image";
import NavItems from "@/components/NavItems";
import UserDropdown from "@/components/UserDropdown";
import {searchStocks} from "@/lib/actions/finnhub.actions";

const  Header = async ({ user }: {user: User}) => {

    const initialStocks = await searchStocks();

    return (
        <header className="sticky top-0 header">
            <div className="container header-wrapper">
            <Link href="/">
                <Image src="/assets/icons/stock-watch_logo.svg" alt="Stock Watch logo" width={160} height={32} className="h-8 w-auto cursor-pointer" />
            </Link>
                <nav>
                    <NavItems initialStocks={initialStocks}/>
                </nav>

                <UserDropdown user={user} initialStocks={initialStocks}/>
            </div>
        </header>
    )
}
export default  Header
