import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { format } from 'date-fns'

interface DataPoint {
  timestamp: string
  temperature: number
  humidity: number
  distance: number
  light: number
  motion: boolean
}

export function DataVisualizationMode() {
  const [historicalData, setHistoricalData] = useState<DataPoint[]>([])
  const [realTimeData, setRealTimeData] = useState<DataPoint[]>([])
  const [activeChart, setActiveChart] = useState('temperature')
  const [timeRange, setTimeRange] = useState('1h')

  useEffect(() => {
    // Generate historical data for demo
    const generateHistoricalData = () => {
      const data: DataPoint[] = []
      const now = new Date()
      
      for (let i = 60; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 60000) // Every minute
        data.push({
          timestamp: format(timestamp, 'HH:mm'),
          temperature: 20 + Math.sin(i * 0.1) * 5 + Math.random() * 2,
          humidity: 45 + Math.cos(i * 0.08) * 10 + Math.random() * 3,
          distance: 80 + Math.sin(i * 0.15) * 30 + Math.random() * 10,
          light: 60 + Math.sin(i * 0.05) * 20 + Math.random() * 5,
          motion: Math.random() > 0.7
        })
      }
      setHistoricalData(data)
      setRealTimeData(data.slice(-10)) // Last 10 points for real-time
    }

    generateHistoricalData()

    // Simulate real-time updates
    const interval = setInterval(() => {
      const now = new Date()
      const newPoint: DataPoint = {
        timestamp: format(now, 'HH:mm:ss'),
        temperature: 20 + Math.sin(Date.now() * 0.001) * 5 + Math.random() * 2,
        humidity: 45 + Math.cos(Date.now() * 0.0008) * 10 + Math.random() * 3,
        distance: 80 + Math.sin(Date.now() * 0.0015) * 30 + Math.random() * 10,
        light: 60 + Math.sin(Date.now() * 0.0005) * 20 + Math.random() * 5,
        motion: Math.random() > 0.7
      }

      setRealTimeData(prev => [...prev.slice(-9), newPoint])
      setHistoricalData(prev => [...prev.slice(-59), newPoint])
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const chartTypes = [
    { id: 'temperature', label: 'Temperature', color: '#ff6b35', unit: '°C' },
    { id: 'humidity', label: 'Humidity', color: '#4ecdc4', unit: '%' },
    { id: 'distance', label: 'Distance', color: '#00d4ff', unit: 'cm' },
    { id: 'light', label: 'Light', color: '#ffd700', unit: '%' }
  ]

  const timeRanges = [
    { id: '1h', label: '1 Hour' },
    { id: '6h', label: '6 Hours' },
    { id: '24h', label: '24 Hours' },
    { id: '7d', label: '7 Days' }
  ]

  const getChartData = () => {
    return timeRange === '1h' ? historicalData : historicalData
  }

  const getCurrentStats = () => {
    const latest = realTimeData[realTimeData.length - 1]
    if (!latest) return null

    return {
      temperature: { value: latest.temperature.toFixed(1), trend: 'up', change: '+0.3' },
      humidity: { value: latest.humidity.toFixed(1), trend: 'down', change: '-1.2' },
      distance: { value: latest.distance.toFixed(1), trend: 'stable', change: '0.0' },
      light: { value: latest.light.toFixed(1), trend: 'up', change: '+2.1' }
    }
  }

  const stats = getCurrentStats()

  const motionData = historicalData.reduce((acc, point) => {
    const hour = point.timestamp.split(':')[0]
    acc[hour] = (acc[hour] || 0) + (point.motion ? 1 : 0)
    return acc
  }, {} as Record<string, number>)

  const motionChartData = Object.entries(motionData).map(([hour, count]) => ({
    hour: `${hour}:00`,
    motions: count
  }))

  const systemHealthData = [
    { name: 'Sensors', value: 98, color: '#00ff00' },
    { name: 'Network', value: 95, color: '#00d4ff' },
    { name: 'Storage', value: 87, color: '#ffd700' },
    { name: 'CPU', value: 76, color: '#ff6b35' }
  ]

  return (
    <div className="mode-panel data-viz-mode">
      <div className="mode-header">
        <h3>📊 DATA VISUALIZATION</h3>
        <div className="time-range-selector">
          {timeRanges.map(range => (
            <button
              key={range.id}
              className={`time-btn ${timeRange === range.id ? 'active' : ''}`}
              onClick={() => setTimeRange(range.id)}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Real-time Stats Cards */}
      <div className="stats-grid">
        {stats && chartTypes.map(chart => {
          const stat = stats[chart.id as keyof typeof stats]
          return (
            <motion.div
              key={chart.id}
              className="stat-card"
              whileHover={{ scale: 1.02 }}
            >
              <div className="stat-header">
                <span className="stat-label">{chart.label}</span>
                <span className={`trend-indicator ${stat.trend}`}>
                  {stat.trend === 'up' ? '↗' : stat.trend === 'down' ? '↘' : '→'}
                </span>
              </div>
              <div className="stat-value" style={{ color: chart.color }}>
                {stat.value}{chart.unit}
              </div>
              <div className={`stat-change ${stat.trend}`}>
                {stat.change}{chart.unit}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Chart Type Selector */}
      <div className="chart-selector">
        {chartTypes.map(chart => (
          <button
            key={chart.id}
            className={`chart-btn ${activeChart === chart.id ? 'active' : ''}`}
            onClick={() => setActiveChart(chart.id)}
            style={{ borderColor: chart.color }}
          >
            <div className="chart-btn-dot" style={{ backgroundColor: chart.color }}></div>
            {chart.label}
          </button>
        ))}
      </div>

      {/* Main Chart */}
      <div className="main-chart">
        <h4>{chartTypes.find(c => c.id === activeChart)?.label} Trends</h4>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={getChartData()}>
            <CartesianGrid strokeDasharray="3 3" stroke="#00d4ff20" />
            <XAxis 
              dataKey="timestamp" 
              stroke="#00d4ff" 
              fontSize={10}
            />
            <YAxis 
              stroke="#00d4ff" 
              fontSize={10}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#001122', 
                border: '1px solid #00d4ff',
                borderRadius: '4px'
              }}
            />
            <Area
              type="monotone"
              dataKey={activeChart}
              stroke={chartTypes.find(c => c.id === activeChart)?.color}
              fill={`${chartTypes.find(c => c.id === activeChart)?.color}20`}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Secondary Charts */}
      <div className="secondary-charts">
        {/* Motion Activity */}
        <div className="chart-container">
          <h4>Motion Activity</h4>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={motionChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#00d4ff20" />
              <XAxis dataKey="hour" stroke="#00d4ff" fontSize={10} />
              <YAxis stroke="#00d4ff" fontSize={10} />
              <Tooltip />
              <Bar dataKey="motions" fill="#00ff00" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* System Health */}
        <div className="chart-container">
          <h4>System Health</h4>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie
                data={systemHealthData}
                cx="50%"
                cy="50%"
                innerRadius={20}
                outerRadius={40}
                dataKey="value"
              >
                {systemHealthData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="performance-metrics">
        <h4>Performance Analytics</h4>
        <div className="metrics-grid">
          <div className="metric-item">
            <span className="metric-label">Avg Response Time</span>
            <span className="metric-value">12ms</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Data Points/Hour</span>
            <span className="metric-value">3,600</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Uptime</span>
            <span className="metric-value">99.8%</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Accuracy</span>
            <span className="metric-value">97.2%</span>
          </div>
        </div>
      </div>
    </div>
  )
}