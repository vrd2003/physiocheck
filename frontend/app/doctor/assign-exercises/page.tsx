'use client'

import { useState, useEffect } from 'react'
import { api, apiEndpoints } from '@/lib/api'
import { motion } from 'framer-motion'
import { Search, Filter, Target, Clock, Users, Plus, Calendar, Check } from 'lucide-react'
import { Card } from '@/components/cards/Card'
import { ExerciseCard } from '@/components/cards/ExerciseCard'

interface Exercise {
  id: string
  name: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration: number
  bodyPart: string[]
  equipment: string[]
}

interface Patient {
  id: string
  name: string
}

export default function AssignExercisesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
  const [bodyPartFilter, setBodyPartFilter] = useState<string>('all')
  const [selectedPatients, setSelectedPatients] = useState<string[]>([])
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)

  /* REMOVE STATIC DATA */
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [exercisesRes, patientsRes] = await Promise.all([
        api.get('/exercises'),
        api.get(apiEndpoints.doctor.patients.list)
      ])
      
      // Map API data to frontend interfaces
      // Backend exercises: name, description, difficulty, body_part (snake_case)
      const mappedExercises = exercisesRes.data.map((ex: any) => ({
        id: ex.id,
        name: ex.name,
        description: ex.description || '',
        difficulty: ex.difficulty || 'beginner',
        duration: Math.round((ex.default_duration_seconds || 600) / 60), // Convert seconds to minutes
        bodyPart: ex.body_part || [],
        equipment: ex.equipment || []
      }))

      const mappedPatients = patientsRes.data.map((p: any) => ({
        id: p.id, // Patient ID
        name: p.full_name
      }))

      setExercises(mappedExercises)
      setPatients(mappedPatients)

    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         exercise.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDifficulty = difficultyFilter === 'all' || exercise.difficulty === difficultyFilter
    const matchesBodyPart = bodyPartFilter === 'all' || exercise.bodyPart.includes(bodyPartFilter)
    
    return matchesSearch && matchesDifficulty && matchesBodyPart
  })

  const bodyParts = Array.from(new Set(exercises.flatMap(ex => ex.bodyPart)))

  const handleAssignExercise = async () => {
    if (selectedExercise && selectedPatients.length > 0) {
        try {
            // Get values from inputs (using refs or state would be cleaner, but for now document.getElementById or just simple state binding in the render if added)
            // Ideally we need state for these inputs. Let's assume standard defaults for now or add state.
            // Since I can't see the inputs state variables, I will add them in a separate chunk or just use defaults here.
            
            // Wait, the previous code didn't have state for sets/reps! 
            // I need to add state for assignment details: sets, reps, frequency.
            
            const payload = {
                exercise_id: selectedExercise,
                patient_ids: selectedPatients,
                sets: assignmentDetails.sets,
                reps: assignmentDetails.reps,
                frequency: assignmentDetails.frequency,
                notes: "" 
            }
            
            await api.post('/doctor/assignments', payload)
            
            alert("Exercise assigned successfully!") // Simple feedback
            
            setShowAssignModal(false)
            setSelectedExercise(null)
            setSelectedPatients([])
        } catch (e) {
            console.error("Assignment failed", e)
            alert("Failed to assign exercise.")
        }
    }
  }

  // Add state for assignment details
  const [assignmentDetails, setAssignmentDetails] = useState({
      sets: 3,
      reps: 12,
      frequency: 'daily'
  })

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Assign Exercises</h1>
          <p className="text-slate-600 mt-2">
            Select exercises to assign to your patients
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Exercise List */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search exercises..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Filter className="w-5 h-5 text-slate-400" />
                    <select
                      value={difficultyFilter}
                      onChange={(e) => setDifficultyFilter(e.target.value)}
                      className="flex-1 border border-slate-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="all">All Difficulty</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Target className="w-5 h-5 text-slate-400" />
                    <select
                      value={bodyPartFilter}
                      onChange={(e) => setBodyPartFilter(e.target.value)}
                      className="flex-1 border border-slate-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="all">All Body Parts</option>
                      {bodyParts.map(part => (
                        <option key={part} value={part}>
                          {part.charAt(0).toUpperCase() + part.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </Card>

            {/* Exercises Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {filteredExercises.map((exercise, index) => (
                <motion.div
                  key={exercise.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ExerciseCard 
                    exercise={exercise} 
                    selectable 
                    selected={selectedExercise === exercise.id}
                    onSelect={() => {
                      setSelectedExercise(exercise.id)
                      setShowAssignModal(true)
                    }}
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Column - Selected Exercise & Patients */}
          <div>
            <Card className="sticky top-24">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-6">
                  Assignment Details
                </h2>

                {selectedExercise ? (
                  <>
                    <div className="mb-6">
                      <h3 className="font-medium text-slate-900 mb-2">
                        Selected Exercise
                      </h3>
                      <div className="p-4 bg-teal-50 rounded-lg">
                        <h4 className="font-medium text-teal-900">
                          {exercises.find(e => e.id === selectedExercise)?.name}
                        </h4>
                        <p className="text-sm text-teal-700 mt-1">
                          {exercises.find(e => e.id === selectedExercise)?.description}
                        </p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-slate-900">
                          Select Patients
                        </h3>
                        <span className="text-sm text-slate-500">
                          {selectedPatients.length} selected
                        </span>
                      </div>
                      <div className="space-y-3">
                        {patients.map(patient => (
                          <label
                            key={patient.id}
                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors duration-200"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPatients.includes(patient.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPatients([...selectedPatients, patient.id])
                                } else {
                                  setSelectedPatients(selectedPatients.filter(id => id !== patient.id))
                                }
                              }}
                              className="h-4 w-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                            />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-slate-900">
                                {patient.name}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Sets & Reps
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="number"
                            placeholder="Sets"
                            className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            min="1"
                            max="10"
                            value={assignmentDetails.sets || ''}
                            onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                setAssignmentDetails({...assignmentDetails, sets: isNaN(val) ? 0 : val})
                            }}
                          />
                          <input
                            type="number"
                            placeholder="Reps per set"
                            className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            min="1"
                            max="50"
                            value={assignmentDetails.reps || ''}
                            onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                setAssignmentDetails({...assignmentDetails, reps: isNaN(val) ? 0 : val})
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Frequency
                        </label>
                        <select 
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            value={assignmentDetails.frequency}
                            onChange={(e) => setAssignmentDetails({...assignmentDetails, frequency: e.target.value})}
                        >
                          <option value="daily">Daily</option>
                          <option value="every_other_day">Every Other Day</option>
                          <option value="weekly">Weekly</option>
                          <option value="twice_weekly">Twice Weekly</option>
                        </select>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAssignExercise}
                        disabled={selectedPatients.length === 0}
                        className="w-full py-3 px-4 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        Assign Exercise
                      </motion.button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">Select an exercise to begin</p>
                    <p className="text-sm text-slate-500 mt-2">
                      Choose from the exercise library on the left
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}