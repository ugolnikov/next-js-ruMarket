import { useState, useEffect } from 'react'

const ProductFilters = ({ onSort, onFilter, filterState, initialSort = 'default' }) => {
    const [currentRange, setCurrentRange] = useState(filterState.currentRange)
    const [isCollapsed, setIsCollapsed] = useState(true)
    const [isFiltered, setIsFiltered] = useState(filterState.isFiltered)
    const [sortValue, setSortValue] = useState(initialSort)

    useEffect(() => {
        setCurrentRange(filterState.currentRange)
        setIsFiltered(filterState.isFiltered)
    }, [filterState])

    const handlePriceChange = (type, value) => {
        const newRange = { ...currentRange, [type]: parseInt(value) || 0 }
        if (type === 'min' && value > currentRange.max) {
            newRange.max = value
        }
        if (type === 'max' && value < currentRange.min) {
            newRange.min = value
        }
        setCurrentRange(newRange)
    }

    const handleRangeSubmit = () => {
        setIsFiltered(true)
        onFilter(`${currentRange.min}-${currentRange.max}`, currentRange, true)
    }

    const clearFilters = () => {
        const defaultRange = { min: 0, max: 100000 }
        setCurrentRange(defaultRange)
        setIsFiltered(false)
        onFilter('all', defaultRange, false)
    }
    const handleSort = (value) => {
        setSortValue(value)
        onSort(value)
    }
    return (
        <div className="mb-8">
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-full mb-2 p-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-between transition-colors duration-200"
            >
                <div className="flex items-center gap-2">
                    <span className="font-medium">Фильтры</span>
                    {isFiltered && (
                        <span className="px-2 py-1 text-xs bg-[#4438ca] text-white rounded-full">
                            {currentRange.min.toLocaleString('ru-RU')} ₽ - {currentRange.max.toLocaleString('ru-RU')} ₽
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {isFiltered && (
                        <span
                            onClick={(e) => {
                                e.stopPropagation()
                                clearFilters()
                            }}
                            className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
                        >
                            Сбросить
                        </span>
                    )}
                    <svg
                        className={`w-5 h-5 transform transition-transform duration-200 ${
                            isCollapsed ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </div>
            </button>
            
            <div className={`transition-all duration-300 ease-in-out ${
                isCollapsed ? 'max-h-0 overflow-hidden opacity-0' : 'max-h-[500px] opacity-100'
            }`}>
                <div className="flex flex-wrap gap-4 items-center justify-between p-6 bg-white rounded-lg shadow-md">
                    <div className="w-full">
                        <div className="flex justify-between mb-2">
                            <span className="font-medium">Цена:</span>
                            <span className="text-sm text-gray-500">
                                {currentRange.min.toLocaleString('ru-RU')} ₽ - {currentRange.max.toLocaleString('ru-RU')} ₽
                            </span>
                        </div>
                        <div className="flex gap-4 mb-4">
                            <div className="relative flex-1">
                                <input
                                    type="range"
                                    min="0"
                                    max="100000"
                                    value={currentRange.min}
                                    onChange={(e) => handlePriceChange('min', e.target.value)}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#4438ca]"
                                />
                                <input
                                    type="number"
                                    value={currentRange.min}
                                    onChange={(e) => handlePriceChange('min', e.target.value)}
                                    className="mt-2 w-full p-2 border rounded text-sm focus:ring-2 focus:ring-[#4438ca] focus:border-[#4438ca]"
                                    placeholder="От"
                                />
                            </div>
                            <div className="relative flex-1">
                                <input
                                    type="range"
                                    min="0"
                                    max="100000"
                                    value={currentRange.max}
                                    onChange={(e) => handlePriceChange('max', e.target.value)}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#4438ca]"
                                />
                                <input
                                    type="number"
                                    value={currentRange.max}
                                    onChange={(e) => handlePriceChange('max', e.target.value)}
                                    className="mt-2 w-full p-2 border rounded text-sm focus:ring-2 focus:ring-[#4438ca] focus:border-[#4438ca]"
                                    placeholder="До"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleRangeSubmit}
                            className="w-full p-2 bg-[#4438ca] text-white rounded hover:bg-[#332b99] transition-colors duration-200"
                        >
                            Применить
                        </button>
                    </div>

                    <div className="w-full md:w-auto">
                        <span className="font-medium block mb-2">Сортировка:</span>
                        <select 
                            value={sortValue}
                            onChange={(e) => handleSort(e.target.value)}
                            className="w-full md:w-auto p-2 border rounded focus:ring-2 focus:ring-[#4438ca] focus:border-[#4438ca]"
                        >
                            <option value="default">По умолчанию</option>
                            <option value="price-asc">Цена: по возрастанию</option>
                            <option value="price-desc">Цена: по убыванию</option>
                            <option value="name-asc">Название: А-Я</option>
                            <option value="name-desc">Название: Я-А</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProductFilters