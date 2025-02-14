const Pagination = ({ currentPage, lastPage, onPageChange }) => {
    const pages = []
    for (let i = 1; i <= lastPage; i++) {
        pages.push(i)
    }

    return (
        <div className="flex justify-center items-center space-x-2 mt-8">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded ${
                    currentPage === 1
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-[#4438ca] text-white hover:bg-[#332b99]'
                }`}>
                Назад
            </button>

            {pages.map(page => (
                <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-4 py-2 rounded ${
                        currentPage === page
                            ? 'bg-[#4438ca] text-white'
                            : 'bg-gray-200 hover:bg-gray-300'
                    }`}>
                    {page}
                </button>
            ))}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === lastPage}
                className={`px-4 py-2 rounded ${
                    currentPage === lastPage
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-[#4438ca] text-white hover:bg-[#332b99]'
                }`}>
                Вперед
            </button>
        </div>
    )
}

export default Pagination 