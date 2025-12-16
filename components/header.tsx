"use client";
import { useScroll } from "@/hooks/use-scroll";
import { Logo } from "@/components/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MobileNav } from "@/components/mobile-nav";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export const navLinks = [
	{
		label: "Tournaments",
		href: "/tournaments",
	},
	{
		label: "Players",
		href: "/players",
	},
	{
		label: "About",
		href: "/about",
	},
];

export function Header() {
	const scrolled = useScroll(10);
	const { isAuthenticated } = useConvexAuth();
	const { signOut } = useAuthActions();
	const router = useRouter();

	const handleAuthClick = async () => {
		if (isAuthenticated) {
			await signOut();
		} else {
			router.push("/signin");
		}
	};

	return (
		<header
			className={cn("sticky top-0 z-50 w-full border-transparent border-b", {
				"border-border bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50":
					scrolled,
			})}
		>
			<nav className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
				<Link className="rounded-md p-2 hover:bg-accent" href="/">
					<Logo/>
				</Link>
				<div className="hidden items-center gap-1 md:flex">
					{navLinks.map((link, i) => (
						<Link
							className={buttonVariants({ variant: "ghost" })}
							href={link.href}
							key={i}
						>
							{link.label}
						</Link>
					))}
					<Button variant="outline" onClick={handleAuthClick}>
						{isAuthenticated ? "Sign Out" : "Sign In"}
					</Button>
				</div>
				<MobileNav />
			</nav>
		</header>
	);
}
