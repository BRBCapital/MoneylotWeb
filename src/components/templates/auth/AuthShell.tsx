import Image from "next/image";
import React from "react";
import { imagesAndIcons } from "@/constants/imagesAndIcons";

export default function AuthShell({
  children,
  logo = "moneylotIconOne",
  stackClassName = "",
  footerCopyrightClassName = "",
  footerCopyrightSpacingClassName = "mt-0",
  scaleSmallText = true,
}: {
  children: React.ReactNode;
  logo?: keyof typeof imagesAndIcons;
  stackClassName?: string;
  footerCopyrightClassName?: string;
  footerCopyrightSpacingClassName?: string;
  scaleSmallText?: boolean;
}) {
  return (
    <div
      className={`${scaleSmallText ? "scale-small-text " : ""}min-h-screen w-full bg-[#F8F8F8] bg-cover bg-center bg-no-repeat`}
      style={{
        backgroundImage: `url(${imagesAndIcons.backgroundImageWeb})`,
      }}
    >
      <div className="relative min-h-screen w-full">
        {/* Centered stack (logo + card) */}
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="flex w-full max-w-[1440px] flex-col items-center">
            <div
              className={`flex w-full flex-col items-center gap-10 ${stackClassName}`}
            >
              <Image
                src={imagesAndIcons[logo]}
                alt="Moneylot"
                width={170}
                height={56}
                priority
                className="h-auto w-[170px]"
              />
              {children}
            </div>
          </div>
        </div>

        {/* Footer stays pinned without affecting centering */}
        <footer className="pointer-events-none absolute bottom-6 left-1/2 w-[min(920px,92vw)] -translate-x-1/2 text-center text-[10px] leading-4 text-[#1B332D]">
          Moneylot is a product of BRB Financial Advisory Limited, a member of
          the BRB Capital Group.
          <br />
          BRB Financial Advisory Limited is a fund manager licensed by the
          Securities and Exchange Commission of Nigeria.
          <span className={`block ${footerCopyrightSpacingClassName} ${footerCopyrightClassName}`}>
            © {new Date().getFullYear()} BRB Capital Limited.
          </span>
        </footer>
      </div>
    </div>
  );
}

