import { Button } from "@/components/ui/button";

export default function Footer() {
    return (
        <footer className="grid grid-cols-6 md:grid-cols-12 items-center border-t">
            <p className="col-start-3 md:col-start-11 text-sm font-medium">v 1.0</p>
            <Button asChild variant="ghost" className="flex justify-self-end col-start-6 md:col-start-12">
                <a
                    href="https://www.patricklh.no/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Patricklh
                </a>
            </Button>
        </footer>
    );
}
