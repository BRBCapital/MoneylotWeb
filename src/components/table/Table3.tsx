"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Pagination from "@/components/table/Pagination";
import Pills from "@/components/ui/Pills";
import TableSkeleton from "@/components/table/TableSkeleton";

export type Table3Row = {
  link?: string;
  onClick?: () => void;
  data: (string | React.ReactNode)[];
};

export type Table3Props = {
  headers: {
    text: string;
    type: "text" | "link" | "pills" | "component";
    className?: string;
    minWidth?: string;
  }[];
  data: Table3Row[];
  loading?: boolean;
  emptyText?: string;
  wrapperClassName?: string;
  highlightColumns?: number[];
  highlightCondition?: (row: Table3Row) => boolean;
  onRowClick?: (row: Table3Row) => void;
  disableHoverAndClick?: boolean;
  pagination?:
    | {
        type: "sychronous";
        limit: number;
        onChange?: (page: number) => void;
      }
    | {
        type: "asynchronous";
        total: number;
        current: number;
        limit: number;
        onChange: (page: number) => Promise<void>;
      };
};

export default function Table3({
  headers,
  data,
  loading,
  emptyText,
  wrapperClassName,
  pagination,
  onRowClick,
  highlightColumns,
  highlightCondition,
  disableHoverAndClick = false,
}: Table3Props) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationLoading, setPaginationLoading] = useState(false);

  const handlePaginationData = (
    rows: Table3Row[],
    page: number,
    limit: number,
  ) => {
    const start = (page - 1) * limit;
    const end = start + limit;
    return rows.slice(start, end);
  };

  const handleOnPaginationChange = async (page: number) => {
    if (!pagination) return;
    setCurrentPage(page);
    if (pagination.type === "asynchronous" && pagination.onChange) {
      try {
        setPaginationLoading(true);
        await pagination.onChange(page);
      } catch (error) {
        console.error("Pagination error:", error);
      } finally {
        setPaginationLoading(false);
      }
    } else if (pagination.type === "sychronous" && pagination.onChange) {
      pagination.onChange(page);
    }
  };

  const getCurrentPageData = () => {
    if (pagination?.type === "sychronous") {
      return handlePaginationData(data, currentPage, pagination.limit);
    }
    return data; // async already filtered server-side
  };

  const getPaginationProps = () => {
    if (!pagination) return null;
    if (pagination.type === "sychronous") {
      return {
        total: data.length,
        current: currentPage,
        limit: pagination.limit,
        onChange: handleOnPaginationChange,
      };
    }
    return {
      total: pagination.total,
      current: pagination.current,
      limit: pagination.limit,
      onChange: handleOnPaginationChange,
    };
  };

  const paginationProps = getPaginationProps();

  return (
    <>
      {loading || paginationLoading ? (
        <TableSkeleton />
      ) : (
        <>
          {data.length === 0 ? (
            <div className="flex items-center justify-center text-center min-h-[260px] w-full py-6 fade-in">
              <p className="text-[14px] text-[#5F6368]">
                {emptyText || "No data available"}
              </p>
            </div>
          ) : (
            <div
              className={
                wrapperClassName ||
                "overflow-x-auto scrollbar-hidden fade-in mb-6 border border-[#E9E9E9] rounded-lg"
              }
            >
              <table id="responsive-table" className="w-full table-auto mb-2">
                <thead className="bg-[#F8F8F8]">
                  <tr className="text-[10.5px] capitalize">
                    {headers.map((header, index) => (
                      <th
                        key={index}
                        className={`${
                          header.className || ""
                        } px-2 py-3 pr-8 text-left text-[12px] font-medium text-[#707775] bg-[#F8F8F8]`}
                        style={{ minWidth: header.minWidth || "170px" }}
                      >
                        {header.text}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {getCurrentPageData().map((row, rowIndex) => {
                    const isRowHighlighted =
                      highlightCondition && highlightCondition(row);

                    return (
                      <tr
                        key={rowIndex}
                        onClick={
                          disableHoverAndClick
                            ? undefined
                            : () => {
                                if (onRowClick) onRowClick(row);
                                else if (row.onClick) row.onClick();
                                else if (row.link) router.push(row.link);
                              }
                        }
                        className={`${
                          disableHoverAndClick
                            ? ""
                            : "hover:bg-gray-100 cursor-pointer"
                        } duration-300 border-b border-[#0000000d] ${
                          isRowHighlighted ? "bg-[#F2F8F0]" : ""
                        }`}
                      >
                        {row.data.map((cell, cellIndex) => {
                          const isCellHighlighted =
                            highlightColumns?.includes(cellIndex);

                          const textStyle = `${
                            headers[cellIndex]?.className || ""
                          } py-4 pr-8 text-left text-sm font-light whitespace-nowrap min-w-[120px] ${
                            isRowHighlighted || isCellHighlighted
                              ? "font-semibold text-[#111]"
                              : ""
                          }`;

                          switch (headers[cellIndex]?.type) {
                            case "text":
                              return (
                                <td key={cellIndex} className="px-2 py-2.5">
                                  <span
                                    className={`${textStyle} ${
                                      typeof cell === "string" &&
                                      cell.startsWith("-")
                                        ? "text-[#E53935] font-medium"
                                        : "text-[#111]"
                                    }`}
                                  >
                                    {cell}
                                  </span>
                                </td>
                              );
                            case "link":
                              return (
                                <td key={cellIndex} className="px-2 py-2.5">
                                  <a href={cell as string}>
                                    <span className={textStyle}>{cell}</span>
                                  </a>
                                </td>
                              );
                            case "pills":
                              return (
                                <td key={cellIndex} className="px-2 py-2.5">
                                  <Pills
                                    type={cell as any}
                                    text={cell as string}
                                  />
                                </td>
                              );
                            case "component":
                              return (
                                <td key={cellIndex} className="px-2 py-2.5">
                                  {cell}
                                </td>
                              );
                            default:
                              return (
                                <td key={cellIndex} className="px-2 py-2.5">
                                  {cell}
                                </td>
                              );
                          }
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {paginationProps && data.length > 0 ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
          <Pagination {...paginationProps} />
          <span className="text-sm text-[#5F6368] sm:whitespace-nowrap">
            {paginationProps.limit} entries per page
          </span>
        </div>
      ) : null}
    </>
  );
}
