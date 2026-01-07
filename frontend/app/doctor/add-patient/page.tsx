'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  UserPlus, User, Mail, Phone, Calendar, 
  AlertCircle, FileText, ArrowLeft, CheckCircle, 
  Activity, Users
} from 'lucide-react'
import { Card } from '@/components/cards/Card'
import { AnimatedLoader } from '@/components/loaders/AnimatedLoader'
import { api, apiEndpoints } from '@/lib/api'

interface PatientFormData {
  name: string
  email: string
  phone: string
  dateOfBirth: string
  conditions: string[]
  allergies: string[]
  medications: string[]
  emergencyContact: string
  emergencyPhone: string
  notes: string
  sendCredentials: boolean
}

interface DoctorStats {
  activePatients: number
  totalPatients: number
}

export default function AddPatientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [doctorStats, setDoctorStats] = useState<DoctorStats | null>(null)
  const [formData, setFormData] = useState<PatientFormData>({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    conditions: [''],
    allergies: [''],
    medications: [''],
    emergencyContact: '',
    emergencyPhone: '',
    notes: '',
    sendCredentials: true
  })

  // Fetch doctor stats on mount
  useEffect(() => {
    fetchDoctorStats()
  }, [])

  const fetchDoctorStats = async () => {
    try {
      const response = await api.get(apiEndpoints.doctor.dashboard.stats)
      const data = response.data
      
      const stats: DoctorStats = {
        activePatients: data.activePatients,
        totalPatients: data.totalPatients
      }
      setDoctorStats(stats)
    } catch (error) {
      // Gracefully handle error by setting defaults
      // eslint-disable-next-line no-console
      console.warn('Could not fetch doctor stats (using defaults):', error)
      setDoctorStats({
        activePatients: 0,
        totalPatients: 0
      })
    }
  }

  const handleInputChange = (field: keyof PatientFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleArrayChange = (field: 'conditions' | 'allergies' | 'medications', index: number, value: string) => {
    const newArray = [...formData[field]]
    newArray[index] = value
    setFormData(prev => ({
      ...prev,
      [field]: newArray
    }))
  }

  const addArrayItem = (field: 'conditions' | 'allergies' | 'medications') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }))
  }

  const removeArrayItem = (field: 'conditions' | 'allergies' | 'medications', index: number) => {
    const newArray = formData[field].filter((_, i) => i !== index)
    setFormData(prev => ({
      ...prev,
      [field]: newArray
    }))
  }

  const validateForm = () => {
    const errors: string[] = []
    
    if (!formData.name.trim()) errors.push('Name is required')
    if (!formData.email.trim()) errors.push('Email is required')
    if (!formData.phone.trim()) errors.push('Phone number is required')
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('Please enter a valid email address')
    }
    
    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth)
      const today = new Date()
      if (dob > today) errors.push('Date of birth cannot be in the future')
    }
    
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const errors = validateForm()
    if (errors.length > 0) {
      alert(errors.join('\n'))
      return
    }
    
    setSubmitting(true)
    
    try {
      // Generate a random password for the patient
      const generatePassword = () => {
        const length = 8
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
        let password = ""
        for (let i = 0; i < length; i++) {
          password += charset.charAt(Math.floor(Math.random() * charset.length))
        }
        return password
      }

      // Filter out empty array items
      const submitData = {
        email: formData.email,
        full_name: formData.name,
        phone: formData.phone,
        date_of_birth: formData.dateOfBirth || null,
        age: formData.dateOfBirth ? new Date().getFullYear() - new Date(formData.dateOfBirth).getFullYear() : null,
        conditions: formData.conditions.filter(item => item.trim()),
        allergies: formData.allergies.filter(item => item.trim()),
        medications: formData.medications.filter(item => item.trim()),
        emergency_contact_name: formData.emergencyContact || null,
        emergency_contact_phone: formData.emergencyPhone || null,
        notes: formData.notes || null,
        sendCredentials: formData.sendCredentials
      }
      
      await api.post(apiEndpoints.doctor.patients.create, submitData)
      
      setSuccess(true)
      
      // Redirect after success
      setTimeout(() => {
        router.push('/doctor/patients')
      }, 2000)
      
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
       // eslint-disable-next-line no-console
      console.error('Error adding patient:', error)
      console.error('Error details:', error.response?.data)
      console.error('Error status:', error.response?.status)
      
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to add patient'
      alert(`Error: ${errorMessage}. Please check console for details.`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <AnimatedLoader message="Loading..." />
      </div>
    )
  }

  if (success) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-4">
              Patient Added Successfully!
            </h1>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              {formData.sendCredentials 
                ? `Account credentials have been sent to ${formData.email}`
                : 'Patient has been added to your dashboard'}
            </p>
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => router.push('/doctor/patients')}
                className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-200 font-medium"
              >
                View All Patients
              </button>
              <button
                onClick={() => {
                  setSuccess(false)
                  setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    dateOfBirth: '',
                    conditions: [''],
                    allergies: [''],
                    medications: [''],
                    emergencyContact: '',
                    emergencyPhone: '',
                    notes: '',
                    sendCredentials: true
                  })
                }}
                className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors duration-200 font-medium"
              >
                Add Another Patient
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/doctor/patients')}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Add New Patient</h1>
                <p className="text-slate-600">Register a new patient to your practice</p>
              </div>
            </div>
            
            {/* Stats */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <div className="flex items-center justify-end space-x-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">Active Patients</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {doctorStats?.activePatients || 0}
                </div>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div className="text-right">
                <div className="flex items-center justify-end space-x-2">
                  <Activity className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">Total Patients</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {doctorStats?.totalPatients || 0}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Personal Information */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="mb-6">
                  <div className="p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 rounded-lg bg-teal-100 text-teal-600">
                        <User className="w-5 h-5" />
                      </div>
                      <h2 className="text-xl font-semibold text-slate-900">
                        Personal Information
                      </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all duration-200"
                          placeholder="John Doe"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Email Address *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="w-full px-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all duration-200"
                            placeholder="patient@example.com"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Phone Number *
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className="w-full px-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all duration-200"
                            placeholder="(123) 456-7890"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Date of Birth
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                            className="w-full px-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all duration-200"
                            max={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Medical Information */}
                <Card className="mb-6">
                  <div className="p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 rounded-lg bg-coral-100 text-coral-600">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <h2 className="text-xl font-semibold text-slate-900">
                        Medical Information
                      </h2>
                    </div>

                    <div className="space-y-6">
                      {/* Conditions */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                          Medical Conditions
                        </label>
                        <div className="space-y-3">
                          {formData.conditions.map((condition, index) => (
                            <div key={index} className="flex items-center space-x-3">
                              <input
                                type="text"
                                value={condition}
                                onChange={(e) => handleArrayChange('conditions', index, e.target.value)}
                                className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all duration-200"
                                placeholder="e.g., Hypertension, Arthritis"
                              />
                              {formData.conditions.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeArrayItem('conditions', index)}
                                  className="px-4 py-3 text-coral-600 hover:bg-coral-50 rounded-lg transition-colors duration-200"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addArrayItem('conditions')}
                            className="text-sm font-medium text-teal-600 hover:text-teal-700"
                          >
                            + Add another condition
                          </button>
                        </div>
                      </div>

                      {/* Allergies */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                          Allergies
                        </label>
                        <div className="space-y-3">
                          {formData.allergies.map((allergy, index) => (
                            <div key={index} className="flex items-center space-x-3">
                              <input
                                type="text"
                                value={allergy}
                                onChange={(e) => handleArrayChange('allergies', index, e.target.value)}
                                className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all duration-200"
                                placeholder="e.g., Penicillin, Latex"
                              />
                              {formData.allergies.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeArrayItem('allergies', index)}
                                  className="px-4 py-3 text-coral-600 hover:bg-coral-50 rounded-lg transition-colors duration-200"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addArrayItem('allergies')}
                            className="text-sm font-medium text-teal-600 hover:text-teal-700"
                          >
                            + Add another allergy
                          </button>
                        </div>
                      </div>

                      {/* Medications */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                          Current Medications
                        </label>
                        <div className="space-y-3">
                          {formData.medications.map((medication, index) => (
                            <div key={index} className="flex items-center space-x-3">
                              <input
                                type="text"
                                value={medication}
                                onChange={(e) => handleArrayChange('medications', index, e.target.value)}
                                className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all duration-200"
                                placeholder="e.g., Lisinopril 10mg daily"
                              />
                              {formData.medications.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeArrayItem('medications', index)}
                                  className="px-4 py-3 text-coral-600 hover:bg-coral-50 rounded-lg transition-colors duration-200"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addArrayItem('medications')}
                            className="text-sm font-medium text-teal-600 hover:text-teal-700"
                          >
                            + Add another medication
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Emergency Contact & Notes */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <div className="p-6">
                      <h3 className="font-semibold text-slate-900 mb-4">Emergency Contact</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Contact Name
                          </label>
                          <input
                            type="text"
                            value={formData.emergencyContact}
                            onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all duration-200"
                            placeholder="Emergency contact name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Contact Phone
                          </label>
                          <input
                            type="tel"
                            value={formData.emergencyPhone}
                            onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all duration-200"
                            placeholder="(123) 456-7890"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card>
                    <div className="p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <FileText className="w-5 h-5 text-slate-400" />
                        <h3 className="font-semibold text-slate-900">Notes</h3>
                      </div>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        className="w-full h-32 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all duration-200 resize-none"
                        placeholder="Additional notes about the patient..."
                      />
                    </div>
                  </Card>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Actions & Summary */}
            <div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="sticky top-8">
                  <div className="p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                        <UserPlus className="w-5 h-5" />
                      </div>
                      <h2 className="text-xl font-semibold text-slate-900">
                        Setup & Actions
                      </h2>
                    </div>

                    {/* Account Setup */}
                    <div className="mb-8">
                      <h3 className="font-medium text-slate-900 mb-4">
                        Account Setup
                      </h3>
                      <div className="space-y-4">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.sendCredentials}
                            onChange={(e) => handleInputChange('sendCredentials', e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                          />
                          <span className="text-slate-700">
                            Send account credentials via email
                          </span>
                        </label>
                        <p className="text-sm text-slate-500">
                          Patient will receive login instructions and temporary password
                        </p>
                      </div>
                    </div>

                    {/* Form Summary */}
                    <div className="mb-8">
                      <h3 className="font-medium text-slate-900 mb-4">
                        Form Summary
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Fields completed</span>
                          <span className="font-medium text-slate-900">
                            {Object.values(formData).filter(val => 
                              typeof val === 'string' ? val.trim() !== '' : 
                              Array.isArray(val) ? val.some(item => item.trim() !== '') : 
                              true
                            ).length}/{Object.keys(formData).length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Required fields</span>
                          <span className="font-medium text-green-600">3/3</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-4">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                      >
                        {submitting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Adding Patient...
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-5 h-5 mr-2" />
                            Add Patient
                          </>
                        )}
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => router.push('/doctor/patients')}
                        className="w-full py-3 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                    </div>

                    {/* Help Text */}
                    <div className="mt-8 pt-6 border-t border-slate-200">
                      <p className="text-sm text-slate-500">
                        <strong>Note:</strong> All fields marked with * are required. 
                        Patients can update their profile information after registration.
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}