import React from 'react'
import Link from "next/link";
import Image from "next/image";
import NavItems from "@/components/NavItems";
import UserDropdown from "@/components/UserDropdown";

const  Header = () => {
    return (
        <header className="sticky top-0 header">
            <div className="container header-wrapper">
            <Link href="/">
                <Image src="/assets/icons/stock-watch_logo.svg" alt="Stock Watch logo" width={160} height={32} className="h-8 w-auto cursor-pointer" />
            </Link>
                <nav>
                    <NavItems />
                </nav>

                <UserDropdown/>
            </div>
        </header>
    )
}
export default  Header
