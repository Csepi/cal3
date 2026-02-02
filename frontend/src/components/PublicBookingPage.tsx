// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BASE_URL } from '../config/apiConfig';

interface ResourceInfo {
  id: number;
  name: string;
  description?: string;
  capacity?: number;
  resourceType: {
    name: string;
    description?: string;
    minBookingDuration?: number;
    bufferTime?: number;
    customerInfoFields?: string[];
  };
  operatingHours?: {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isActive: boolean;
  }[];
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  availableQuantity?: number;
}

interface CustomerInfo {
  [key: string]: string;
}

const PublicBookingPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const [resource, setResource] = useState<ResourceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Booking form state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({});
  const [bookingNotes, setBookingNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Fetch resource information
  useEffect(() => {
    const fetchResource = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${BASE_URL}/api/public/booking/${token}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Resource not found or no longer available');
          }
          throw new Error('Failed to load resource information');
        }

        const data = await response.json();
        setResource(data);
        setError(null);
      } catch (err: unknown) {
        setError(err.message || 'An error occurred while loading the resource');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchResource();
    }
  }, [token]);

  // Fetch available slots when date changes
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!token || !selectedDate) return;

      try {
        setLoadingSlots(true);
        const response = await fetch(
          `${BASE_URL}/api/public/booking/${token}/availability?date=${selectedDate}`
        );

        if (!response.ok) {
          throw new Error('Failed to load availability');
        }

        const data = await response.json();
        setAvailableSlots(data.slots || []);
      } catch (err: unknown) {
        console.error('Error fetching availability:', err);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchAvailability();
  }, [token, selectedDate]);

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setQuantity(1);
    setBookingSuccess(false);
  };

  const handleCustomerInfoChange = (field: string, value: string) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSlot || !token) return;

    try {
      setSubmitting(true);
      setError(null);

      const maxQuantity =
        selectedSlot.availableQuantity ?? resource?.capacity ?? 1;
      const safeQuantity = Math.min(Math.max(1, quantity), maxQuantity);

      if (safeQuantity !== quantity) {
        setQuantity(safeQuantity);
      }

      // The backend expects startTime and endTime as full ISO date strings, not just time
      // selectedSlot.startTime and endTime are already ISO strings from the backend
      const bookingData = {
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        customerName,
        customerEmail,
        customerPhone,
        notes: bookingNotes || undefined,
        quantity: safeQuantity
      };

      const response = await fetch(`${BASE_URL}/api/public/booking/${token}/reserve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create booking');
      }

      // Success!
      setBookingSuccess(true);
      setSelectedSlot(null);
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setCustomerInfo({});
      setBookingNotes('');
      setQuantity(1);

      // Refresh availability
      const availResponse = await fetch(
        `${BASE_URL}/api/public/booking/${token}/availability?date=${selectedDate}`
      );
      if (availResponse.ok) {
        const data = await availResponse.json();
        setAvailableSlots(data.slots || []);
      }
    } catch (err: unknown) {
      setError(err.message || 'Failed to create booking');
      console.error('Booking error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (time: string) => {
    // Handle ISO timestamps like "2025-10-01T13:00:00.000Z" and simple time formats like "HH:mm:ss"
    let timeStr = time;

    // If it's an ISO timestamp, extract just the time portion
    if (time.includes('T')) {
      const date = new Date(time);
      timeStr = date.toTimeString().split(' ')[0]; // Gets "HH:mm:ss"
    }

    const parts = timeStr.split(':');
    const hour = parseInt(parts[0], 10);
    const minutes = parts[1] || '00';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDayOfWeekName = (dayNum: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNum];
  };

  const maxQuantityForSlot = selectedSlot
    ? Math.max(1, selectedSlot.availableQuantity ?? resource?.capacity ?? 1)
    : Math.max(1, resource?.capacity ?? 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking information...</p>
        </div>
      </div>
    );
  }

  if (error && !resource) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Available</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.history.back()}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{resource?.name}</h1>
              {resource?.description && (
                <p className="text-gray-600 mb-3">{resource.description}</p>
              )}
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {resource?.resourceType.name}
                </span>
                {resource?.capacity && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Capacity: {resource.capacity}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Operating Hours */}
          {resource?.operatingHours && resource.operatingHours.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Operating Hours</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                {resource.operatingHours
                  .filter(oh => oh.isActive)
                  .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                  .map(oh => (
                    <div key={oh.dayOfWeek} className="text-gray-600">
                      <span className="font-medium">{getDayOfWeekName(oh.dayOfWeek)}:</span>
                      <br />
                      {formatTime(oh.openTime)} - {formatTime(oh.closeTime)}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Success Message */}
        {bookingSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start">
            <svg className="w-6 h-6 text-green-600 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-green-900 font-semibold">Booking Confirmed!</h3>
              <p className="text-green-700 text-sm mt-1">
                Your reservation has been successfully created. You should receive a confirmation email shortly.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
            <svg className="w-6 h-6 text-red-600 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-red-900 font-semibold">Error</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Date & Time Selection */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Select Date & Time</h2>

            {/* Date Picker */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot(null);
                  setQuantity(1);
                }}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Available Time Slots */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Time Slots
              </label>

              {loadingSlots ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-500 text-sm">Loading available slots...</p>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-600 font-medium">No available slots</p>
                  <p className="text-gray-500 text-sm mt-1">Try selecting a different date</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                  {availableSlots
                    .filter(slot => slot.available)
                    .map((slot, index) => (
                    <button
                      key={index}
                      onClick={() => handleSlotSelect(slot)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        selectedSlot?.startTime === slot.startTime && selectedSlot?.endTime === slot.endTime
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span className="block">
                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                      </span>
                      {typeof slot.availableQuantity === 'number' && (
                        <span
                          className={`block text-xs mt-1 ${
                            selectedSlot?.startTime === slot.startTime &&
                            selectedSlot?.endTime === slot.endTime
                              ? 'text-blue-100'
                              : 'text-gray-500'
                          }`}
                        >
                          {slot.availableQuantity} {slot.availableQuantity === 1 ? 'spot' : 'spots'} left
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Booking Form */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Information</h2>

            {!selectedSlot ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-600 font-medium">Select a time slot to continue</p>
                <p className="text-gray-500 text-sm mt-1">Choose an available time from the left panel</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitBooking} className="space-y-4">
                {/* Selected Slot Display */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-700 font-medium mb-1">Selected Time</p>
                  <p className="text-lg font-bold text-blue-900">
                    {new Date(selectedDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-md text-blue-800">
                    {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                  </p>
                  {typeof selectedSlot.availableQuantity === 'number' && (
                    <p className="text-sm text-blue-600 mt-1">
                      {selectedSlot.availableQuantity}{' '}
                      {selectedSlot.availableQuantity === 1 ? 'spot' : 'spots'} remaining
                    </p>
                  )}
                </div>

                {/* Customer Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="John Doe"
                  />
                </div>

                {/* Customer Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="john@example.com"
                  />
                </div>

                {/* Customer Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                {/* Dynamic Customer Info Fields */}
                {resource?.resourceType.customerInfoFields &&
                 resource.resourceType.customerInfoFields.length > 0 && (
                  <>
                    {resource.resourceType.customerInfoFields.map((field) => (
                      <div key={field}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field}
                        </label>
                        <input
                          type="text"
                          value={customerInfo[field] || ''}
                          onChange={(e) => handleCustomerInfoChange(field, e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    ))}
                  </>
                )}

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Spots <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={maxQuantityForSlot}
                    value={quantity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      if (Number.isNaN(value)) {
                        setQuantity(1);
                        return;
                      }
                      const clamped = Math.min(
                        Math.max(1, value),
                        maxQuantityForSlot,
                      );
                      setQuantity(clamped);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Up to {maxQuantityForSlot}{' '}
                    {maxQuantityForSlot === 1 ? 'spot' : 'spots'} available for
                    this time.
                  </p>
                </div>

                {/* Booking Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Any special requests or information..."
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition ${
                    submitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Booking...
                    </span>
                  ) : (
                    'Confirm Booking'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Powered by PrimeCal Booking System</p>
        </div>
      </div>
    </div>
  );
};

export default PublicBookingPage;

