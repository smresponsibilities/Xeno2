import { NextResponse } from 'next/server'

export async function GET() {
  // Mock customer data to demonstrate how customer names should appear
  const mockCustomers = [
    {
      first_name: 'Sarah',
      last_name: 'Williams',
      email: 'sarah.williams@example.com',
      total_spent: 18900.15,
      orders_count: 15
    },
    {
      first_name: 'Priya',
      last_name: 'Patel',
      email: 'priya.patel@example.com',
      total_spent: 15200.50,
      orders_count: 12
    },
    {
      first_name: 'Alexandra',
      last_name: 'Martinez',
      email: 'alexandra.martinez@example.com',
      total_spent: 12500.75,
      orders_count: 8
    },
    {
      first_name: 'Isabella',
      last_name: 'Garcia',
      email: 'isabella.garcia@example.com',
      total_spent: 9800.90,
      orders_count: 6
    },
    {
      first_name: 'James',
      last_name: 'Thompson',
      email: 'james.thompson@example.com',
      total_spent: 8750.25,
      orders_count: 5
    }
  ]

  return NextResponse.json(mockCustomers)
}
