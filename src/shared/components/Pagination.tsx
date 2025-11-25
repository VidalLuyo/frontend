import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
     currentPage: number;
     totalPages: number;
     onPageChange: (page: number) => void;
     hasNext: boolean;
     hasPrevious: boolean;
     totalItems: number;
     itemsPerPage: number;
}

export function Pagination({
     currentPage,
     totalPages,
     onPageChange,
     hasNext,
     hasPrevious,
     totalItems,
     itemsPerPage,
}: PaginationProps) {
     const startItem = (currentPage - 1) * itemsPerPage + 1;
     const endItem = Math.min(currentPage * itemsPerPage, totalItems);

     const generatePageNumbers = () => {
          const pages: (number | string)[] = [];
          const maxVisiblePages = 5;

          if (totalPages <= maxVisiblePages) {
               for (let i = 1; i <= totalPages; i++) {
                    pages.push(i);
               }
          } else {
               if (currentPage <= 3) {
                    for (let i = 1; i <= 4; i++) {
                         pages.push(i);
                    }
                    pages.push("...");
                    pages.push(totalPages);
               } else if (currentPage >= totalPages - 2) {
                    pages.push(1);
                    pages.push("...");
                    for (let i = totalPages - 3; i <= totalPages; i++) {
                         pages.push(i);
                    }
               } else {
                    pages.push(1);
                    pages.push("...");
                    for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                         pages.push(i);
                    }
                    pages.push("...");
                    pages.push(totalPages);
               }
          }

          return pages;
     };

     if (totalPages <= 1) return null;

     return (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
               <div className="flex-1 flex justify-between sm:hidden">
                    <button
                         onClick={() => onPageChange(currentPage - 1)}
                         disabled={!hasPrevious}
                         className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                         Anterior
                    </button>
                    <button
                         onClick={() => onPageChange(currentPage + 1)}
                         disabled={!hasNext}
                         className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                         Siguiente
                    </button>
               </div>
               <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                         <p className="text-sm text-gray-700">
                              Mostrando{" "}
                              <span className="font-medium">{startItem}</span> a{" "}
                              <span className="font-medium">{endItem}</span> de{" "}
                              <span className="font-medium">{totalItems}</span>{" "}
                              resultados
                         </p>
                    </div>

                    <div>
                         <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                              <button onClick={() => onPageChange(1)}
                                   disabled={!hasPrevious} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                   <span className="sr-only">Primera página</span>
                                   <ChevronsLeft className="h-5 w-5" aria-hidden="true" />
                              </button>
                              <button
                                   onClick={() => onPageChange(currentPage - 1)}
                                   disabled={!hasPrevious}
                                   className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                   <span className="sr-only">Anterior</span>
                                   <ChevronLeft
                                        className="h-5 w-5"
                                        aria-hidden="true"
                                   />
                              </button>

                              {generatePageNumbers().map((page, index) => (
                                   <button
                                        key={index}
                                        onClick={() =>
                                             typeof page === "number"
                                                  ? onPageChange(page)
                                                  : undefined
                                        }
                                        disabled={typeof page !== "number"}
                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === currentPage
                                             ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                                             : typeof page === "number"
                                                  ? "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                                  : "bg-white border-gray-300 text-gray-300 cursor-default"
                                             }`}
                                   >
                                        {page}
                                   </button>
                              ))}
                              <button
                                   onClick={() => onPageChange(currentPage + 1)}
                                   disabled={!hasNext}
                                   className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                   <span className="sr-only">Siguiente</span>
                                   <ChevronRight
                                        className="h-5 w-5"
                                        aria-hidden="true"
                                   />
                              </button>
                              <button
                                   onClick={() => onPageChange(totalPages)}
                                   disabled={!hasNext}
                                   className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                   <span className="sr-only">
                                        Última página
                                   </span>
                                   <ChevronsRight
                                        className="h-5 w-5"
                                        aria-hidden="true"
                                   />
                              </button>
                         </nav>
                    </div>
               </div>
          </div >
     );
}
