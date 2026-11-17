import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import RoomsPage from './Rooms.jsx'
import * as propertyService from '../../services/property.js'

describe('Rooms.jsx Component Tests (Tutup Penjualan, Tambah/Edit Kamar & Weekend Surcharge)', () => {
  const sampleProperty = {
    id: 'prop-1',
    name: 'Wisma Grand Nusantara',
    roomTypes: [
      {
        id: 'deluxe',
        name: 'Deluxe Room',
        price: 250000,
        originalPrice: 300000,
        capacity: 2,
        qty: 3,
        weekendSurchargePercent: 20,
      },
    ],
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(propertyService, 'getProperty').mockResolvedValue(sampleProperty)
  })

  const renderRooms = () =>
    render(
      <MemoryRouter initialEntries={['/mitra/properti/prop-1/kamar']}>
        <Routes>
          <Route path="/mitra/properti/:id/kamar" element={<RoomsPage />} />
        </Routes>
      </MemoryRouter>,
    )

  it('merender badge weekend surcharge pada baris tipe kamar', async () => {
    renderRooms()
    await waitFor(() => {
      expect(screen.getByText('Deluxe Room')).toBeInTheDocument()
    })
    expect(screen.getByText(/⚡ Weekend \+20%/i)).toBeInTheDocument()
  })

  it('tombol Tutup Penjualan / Buka Kamar memanggil updateRoomType dengan toggle qty', async () => {
    const updateSpy = vi.spyOn(propertyService, 'updateRoomType').mockResolvedValue({})
    renderRooms()

    await waitFor(() => {
      expect(screen.getByText('Deluxe Room')).toBeInTheDocument()
    })

    const toggleBtn = screen.getByRole('button', { name: /Tutup Penjualan/i })
    fireEvent.click(toggleBtn)

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        'prop-1',
        'deluxe',
        expect.objectContaining({ qty: 0 }),
      )
    })
  })

  it('tombol Tambah Tipe Kamar membuka modal form dan dapat men-submit surcharge weekend', async () => {
    const addSpy = vi.spyOn(propertyService, 'addRoomType').mockResolvedValue({})
    renderRooms()

    await waitFor(() => {
      expect(screen.getByText('Deluxe Room')).toBeInTheDocument()
    })

    const addBtn = screen.getByRole('button', { name: /\+ Tambah Tipe Kamar/i })
    fireEvent.click(addBtn)

    expect(screen.getByText(/Tambah Tipe Kamar Baru/i)).toBeInTheDocument()

    // Isi form
    fireEvent.change(screen.getByPlaceholderText(/misal: Deluxe King/i), { target: { value: 'Suite Room' } })
    fireEvent.change(screen.getByPlaceholderText('250000'), { target: { value: '500000' } })
    fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '25' } }) // weekend surcharge input

    const saveBtn = screen.getByRole('button', { name: /Simpan Tipe Kamar/i })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(addSpy).toHaveBeenCalledWith(
        'prop-1',
        expect.objectContaining({
          name: 'Suite Room',
          price: 500000,
          weekendSurchargePercent: 25,
        }),
      )
    })
  })
})
