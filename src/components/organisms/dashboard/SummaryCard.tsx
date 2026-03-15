import Image from "next/image";
import { imagesAndIcons } from "@/constants/imagesAndIcons";

type SummaryCardProps = {
  title: string;
  value: string;
  icon: keyof typeof imagesAndIcons;
};

export default function SummaryCard({ title, value, icon }: SummaryCardProps) {
  return (
    <div className="bg-white rounded-[10px] border border-[#EEEEEE] px-5 py-4 flex items-start gap-4">
      <Image
        src={imagesAndIcons[icon]}
        alt={title}
        width={45}
        height={45}
        className="mt-0.5 w-[45px] h-[45px] flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] text-[#5F6368] mb-1">{title}</p>
        <p className="text-[18px] font-semibold text-[#2E2E2E]">{value}</p>
      </div>
    </div>
  );
}
