import { useState, useMemo } from 'react'

interface UsePaginationProps<T> {
     data: T[]
     itemsPerPage?: number
}

export function usePagination<T>({ data, itemsPerPage = 8 }: UsePaginationProps<T>) {
     const [currentPage, setCurrentPage] = useState(1)

     const totalPages = useMemo(() => {
          return Math.ceil(data.length / itemsPerPage)
     }, [data.length, itemsPerPage])

     const paginatedData = useMemo(() => {
          const startIndex = (currentPage - 1) * itemsPerPage
          const endIndex = startIndex + itemsPerPage
          return data.slice(startIndex, endIndex)
     }, [data, currentPage, itemsPerPage])

     const goToPage = (page: number) => {
          if (page >= 1 && page <= totalPages) {
               setCurrentPage(page)
          }
     }

     const goToNext = () => {
          if (currentPage < totalPages) {
               setCurrentPage(prev => prev + 1)
          }
     }

     const goToPrevious = () => {
          if (currentPage > 1) {
               setCurrentPage(prev => prev - 1)
          }
     }

     const resetPagination = () => {
          setCurrentPage(1)
     }

     return {
          currentPage,
          totalPages,
          paginatedData,
          goToPage,
          goToNext,
          goToPrevious,
          resetPagination,
          hasNext: currentPage < totalPages,
          hasPrevious: currentPage > 1,
          totalItems: data.length
     }
}
