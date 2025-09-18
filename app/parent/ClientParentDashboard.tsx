'use client'
import { useEffect, useState } from 'react'

type Note = { id: string; createdAt: string; text: string; student?: { id: string; name?: string; firstName?: string; lastName?: string } }
type DailyLog = { id: string; date: string; minutes: number; notes?: string; student?: { id: string; name?: string; firstName?: string; lastName?: string } }

export default function ClientParentDashboard() { return null }
