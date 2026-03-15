"use client";

import { useEffect, useMemo, useState } from "react";

type PaginationProps = {
  total: number;
  current: number;
  limit: number;
  onChange: (page: number) => void;
};

export default function Pagination({
  total,
  current,
  limit,
  onChange,
}: PaginationProps) {
  const [currentPage, setCurrentPage] = useState(current);

  useEffect(() => setCurrentPage(current), [current]);

  const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const handlePrev = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      onChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < pages) {
      setCurrentPage(currentPage + 1);
      onChange(currentPage + 1);
    }
  };

  const renderPageNumbers = () => {
    const pageNumbers: Array<number | "..."> = [];
    const maxPageNumbers = 7;

    if (pages <= maxPageNumbers) {
      for (let i = 1; i <= pages; i++) pageNumbers.push(i);
    } else {
      const leftBound = Math.max(1, currentPage - 2);
      const rightBound = Math.min(pages, currentPage + 2);

      if (currentPage - 1 > 2) pageNumbers.push(1, "...");
      for (let i = leftBound; i <= rightBound; i++) pageNumbers.push(i);
      if (pages - currentPage > 2) pageNumbers.push("...", pages);
    }

    return pageNumbers.map((page, index) => (
      <div
        key={`${page}-${index}`}
        onClick={() => {
          if (typeof page === "number") {
            setCurrentPage(page);
            onChange(page);
          }
        }}
        className={`cursor-pointer flex justify-center items-center w-[42px] h-[42px] rounded-md ${
          typeof page === "number"
            ? page === currentPage
              ? "font-semibold text-[#89E081]"
              : "text-[#5F6368]"
            : "text-[#272363]"
        }`}
      >
        {page}
      </div>
    ));
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-2 gap-5 md:gap-0">
      <div className="flex items-center gap-x-2 justify-center md:justify-start">
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous page"
          className={`${
            currentPage === 1 ? "opacity-50 cursor-not-allowed" : "opacity-100"
          } flex justify-center items-center rounded-md`}
          disabled={currentPage === 1}
        >
          <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 3.33334L5.33333 8L10 12.6667"
              stroke="#5F6368"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {renderPageNumbers()}

        <button
          type="button"
          onClick={handleNext}
          aria-label="Next page"
          className={`${
            currentPage === pages ? "opacity-50 cursor-not-allowed" : "opacity-100"
          } flex justify-center items-center rounded-md`}
          disabled={currentPage === pages}
        >
          <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
            <path
              d="M6 3.33334L10.6667 8L6 12.6667"
              stroke="#5F6368"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

