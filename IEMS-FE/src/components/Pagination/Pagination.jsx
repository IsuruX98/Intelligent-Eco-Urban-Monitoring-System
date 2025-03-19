import React from "react";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pageNeighbours = 2; // Number of page links to show before and after the current page

  // Function to generate an array of page numbers around the current page
  const getPageNumbers = () => {
    const startPage = Math.max(1, currentPage - pageNeighbours);
    const endPage = Math.min(totalPages, currentPage + pageNeighbours);
    const pagesToShow = endPage - startPage + 1;

    let pageNumbers = Array.from(
      { length: pagesToShow },
      (_, index) => startPage + index
    );

    // Add ellipsis if necessary
    const hasLeftEllipsis = startPage > 1;
    const hasRightEllipsis = endPage < totalPages;

    if (hasLeftEllipsis) {
      pageNumbers = [1, "..."].concat(pageNumbers);
    }

    if (hasRightEllipsis) {
      pageNumbers = pageNumbers.concat(["...", totalPages]);
    }

    return pageNumbers;
  };

  console.log("currentPage:", currentPage);
  console.log("totalPages:", totalPages);

  return (
    <nav className="mt-8" aria-label="Page navigation example">
      <ul className="flex justify-center text-sm">
        <li>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            className={`flex items-center justify-center px-3 h-8 ms-0 leading-tight text-gray-500 bg-white border border-e-0 border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white ${
              currentPage === 1 ? "cursor-not-allowed opacity-50" : ""
            }`}
            disabled={currentPage === 1}
          >
            Previous
          </button>
        </li>
        {getPageNumbers().map((number, index) => (
          <li key={index}>
            {number === "..." ? (
              <span className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 font-medium mr-2">
                ...
              </span>
            ) : (
              <button
                onClick={() => onPageChange(number)}
                className={`flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white ${
                  currentPage === number
                    ? "text-blue-600 border-blue-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                    : ""
                }`}
              >
                {number}
              </button>
            )}
          </li>
        ))}
        <li>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            className={`flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white ${
              currentPage === totalPages ? "cursor-not-allowed opacity-50" : ""
            }`}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;
