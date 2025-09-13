'use client'

import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"

interface OrdersChartData {
  date: string
  count: number
}

interface OrdersChartProps {
  data: OrdersChartData[]
  startDate: Date
  setStartDate: (date: Date) => void
  endDate: Date
  setEndDate: (date: Date) => void
  isLoading: boolean
  animationVariants?: any
}

export default function OrdersChart({
  data,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  isLoading,
  animationVariants,
}: OrdersChartProps) {
  const SkeletonLoader = () => (
    <div className="w-full h-80 bg-gray-200 rounded-lg animate-pulse"></div>
  )

  return (
    <motion.div
      variants={animationVariants}
      className="p-6 bg-white/50 backdrop-blur-md border border-gray-200/50 rounded-xl shadow-lg"
    >
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h3 className="text-xl font-bold text-gray-800">Orders Over Time</h3>
        <div className="flex items-center gap-2 text-sm sm:gap-4">
          <div>
            <span className="mr-2 text-gray-600">From:</span>
            <DatePicker
              selected={startDate}
              onChange={(date) => date && setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              className="w-32 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              dateFormat="yyyy-MM-dd"
            />
          </div>
          <div>
            <span className="mr-2 text-gray-600">To:</span>
            <DatePicker
              selected={endDate}
              onChange={(date) => date && setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              className="w-32 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              dateFormat="yyyy-MM-dd"
            />
          </div>
        </div>
      </div>

      <div className="mt-6" style={{ width: '100%', height: 300 }}>
        {isLoading ? (
          <SkeletonLoader />
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-gray-500">No orders found for the selected date range</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af"
                fontSize={12}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                }}
              />
              <YAxis 
                allowDecimals={false} 
                stroke="#9ca3af"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '0.5rem',
                  fontSize: '14px',
                }}
                labelFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#4f46e5"
                strokeWidth={3}
                name="Orders"
                dot={{ r: 4, fill: '#4f46e5' }}
                activeDot={{ r: 6, fill: '#4f46e5' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  )
}
