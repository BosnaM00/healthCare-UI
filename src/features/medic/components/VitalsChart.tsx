import React, { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea,
} from 'recharts'
import { format } from 'date-fns'
import type { VitalReading } from '@/types'

type VitalKey = 'heartRate' | 'systolicBp' | 'diastolicBp' | 'weightKg' | 'oxygenSaturation'

const VITAL_CONFIG: Record<VitalKey, {
  label: string
  unit: string
  color: string
  normalMin: number
  normalMax: number
  mildMin?: number
  mildMax?: number
}> = {
  heartRate: {
    label: 'Heart Rate',
    unit: 'bpm',
    color: 'var(--color-accent)',
    normalMin: 60,
    normalMax: 100,
    mildMin: 50,
    mildMax: 110,
  },
  systolicBp: {
    label: 'Systolic BP',
    unit: 'mmHg',
    color: '#0EA5E9',
    normalMin: 90,
    normalMax: 120,
    mildMin: 80,
    mildMax: 140,
  },
  diastolicBp: {
    label: 'Diastolic BP',
    unit: 'mmHg',
    color: '#6366F1',
    normalMin: 60,
    normalMax: 80,
    mildMin: 50,
    mildMax: 90,
  },
  weightKg: {
    label: 'Weight',
    unit: 'kg',
    color: '#10B981',
    normalMin: 0,
    normalMax: 999,
  },
  oxygenSaturation: {
    label: 'O₂ Saturation',
    unit: '%',
    color: '#F59E0B',
    normalMin: 95,
    normalMax: 100,
    mildMin: 90,
    mildMax: 100,
  },
}

function classifyValue(value: number, cfg: (typeof VITAL_CONFIG)[VitalKey]): 'ok' | 'mild' | 'bad' {
  if (value >= cfg.normalMin && value <= cfg.normalMax) return 'ok'
  if (cfg.mildMin !== undefined && cfg.mildMax !== undefined) {
    if (value >= cfg.mildMin && value <= cfg.mildMax) return 'mild'
  }
  return 'bad'
}

interface VitalsChartProps {
  readings: VitalReading[]
  vitalKey: VitalKey
}

export function VitalsChart({ readings, vitalKey }: VitalsChartProps) {
  const cfg = VITAL_CONFIG[vitalKey]

  const data = readings
    .filter((r) => r[vitalKey] !== undefined)
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
    .map((r) => ({
      date: format(new Date(r.recordedAt), 'dd MMM'),
      value: r[vitalKey] as number,
      severity: classifyValue(r[vitalKey] as number, cfg),
    }))

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props
    const fill =
      payload.severity === 'ok'
        ? 'var(--color-success)'
        : payload.severity === 'mild'
          ? 'var(--color-warning)'
          : 'var(--color-danger)'
    return <circle cx={cx} cy={cy} r={4} fill={fill} strokeWidth={0} />
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-[--color-text-primary] mb-3">
        {cfg.label} <span className="text-[--color-text-tertiary] font-normal">({cfg.unit})</span>
      </h3>

      {data.length === 0 ? (
        <p className="text-sm text-[--color-text-tertiary] py-8 text-center">No readings recorded</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  fontSize: 12,
                }}
                formatter={(value: number) => [`${value} ${cfg.unit}`, cfg.label]}
              />

              {/* Normal band shading */}
              <ReferenceArea
                y1={cfg.normalMin}
                y2={cfg.normalMax}
                fill="var(--color-success)"
                fillOpacity={0.08}
              />

              {/* Normal range reference lines */}
              <ReferenceLine
                y={cfg.normalMax}
                stroke="var(--color-success)"
                strokeDasharray="4 4"
                strokeOpacity={0.6}
                label={{ value: 'Normal max', fontSize: 10, fill: 'var(--color-success)' }}
              />
              <ReferenceLine
                y={cfg.normalMin}
                stroke="var(--color-success)"
                strokeDasharray="4 4"
                strokeOpacity={0.6}
                label={{ value: 'Normal min', fontSize: 10, fill: 'var(--color-success)' }}
              />

              <Line
                type="monotone"
                dataKey="value"
                stroke={cfg.color}
                strokeWidth={2}
                dot={<CustomDot />}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Accessible data table */}
          <table className="sr-only" aria-label={`${cfg.label} readings data table`}>
            <thead>
              <tr>
                <th>Date</th>
                <th>{cfg.label} ({cfg.unit})</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  <td>{row.date}</td>
                  <td>{row.value}</td>
                  <td>{row.severity}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-2 text-xs text-[--color-text-tertiary]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[--color-success] inline-block" />
              Normal
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[--color-warning] inline-block" />
              Borderline
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[--color-danger] inline-block" />
              Out of range
            </span>
          </div>
        </>
      )}
    </div>
  )
}
