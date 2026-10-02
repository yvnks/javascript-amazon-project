import Link from "next/link";
import { BackIcon } from "./icons";

// On phones the title is centred between a back button and an empty slot.
export function PageHeading({
  title,
  back,
  children,
}: {
  title: string;
  back?: { href: string; label: string };
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      {back && (
        <Link className="icon-button back-button" href={back.href} aria-label={back.label}>
          <BackIcon />
        </Link>
      )}
      <h1 className="page-title">
        {title}
        {children}
      </h1>
    </div>
  );
}
