'use client'

import { motion } from 'framer-motion'
import { Activity, User, Video, TrendingUp, Smartphone, Heart, CheckCircle } from 'lucide-react'
import { useState } from 'react'

export function PhysioAnimation() {
  const [activeStep, setActiveStep] = useState(0)

  const steps = [
    {
      icon: User,
      title: 'Patient Onboarding',
      description: 'Create profile & set goals',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
    },
    {
      icon: Video,
      title: 'Guided Exercises',
      description: 'AI-powered form correction',
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-100',
      textColor: 'text-emerald-700',
    },
    {
      icon: Activity,
      title: 'Live Monitoring',
      description: 'Real-time progress tracking',
      color: 'from-violet-500 to-purple-500',
      bgColor: 'bg-violet-100',
      textColor: 'text-violet-700',
    },
    {
      icon: TrendingUp,
      title: 'Progress Analytics',
      description: 'Detailed reports & insights',
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-700',
    },
  ]

  const stats = [
    { value: '95%', label: 'Accuracy', icon: CheckCircle, color: 'text-green-600' },
    { value: '24/7', label: 'Monitoring', icon: Activity, color: 'text-blue-600' },
    { value: '500+', label: 'Exercises', icon: Heart, color: 'text-red-600' },
  ]

  return (
    <div className="relative w-full h-[400px] sm:h-[450px] bg-gradient-to-br from-slate-50 to-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-1">
          How PhysioCheck Works
        </h3>
        <p className="text-sm text-slate-600">
          Simple, effective rehabilitation in 4 steps
        </p>
      </div>

      {/* Flow Steps - Horizontal */}
      <div className="relative mb-8 sm:mb-10">
        {/* Connection Line */}
        <div className="absolute top-6 left-8 right-8 h-0.5 bg-slate-200 z-0" />
        <motion.div
          className="absolute top-6 left-8 h-0.5 bg-teal-500 z-10"
          initial={{ width: '0%' }}
          animate={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.5 }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const StepIcon = step.icon // Extract the icon component
            return (
              <div key={index} className="flex flex-col items-center relative z-20">
                <motion.button
                  onClick={() => setActiveStep(index)}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg mb-2 transition-all duration-300 ${
                    index <= activeStep
                      ? `bg-gradient-to-br ${step.color} text-white`
                      : 'bg-white text-slate-400'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <StepIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </motion.button>
                
                {/* Step Label - Only show for active step on mobile */}
                <div className="hidden sm:block text-center">
                  <div className={`text-xs font-medium mb-1 ${
                    index === activeStep ? 'text-slate-900' : 'text-slate-500'
                  }`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-slate-500 max-w-[80px] mx-auto">
                    {step.description}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Active Step Content */}
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-4 sm:p-6 shadow-inner border border-slate-100">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <div className={`w-16 h-16 rounded-full ${steps[activeStep].bgColor} flex items-center justify-center flex-shrink-0`}>
            {(() => {
              const ActiveIcon = steps[activeStep].icon
              return <ActiveIcon className={`w-8 h-8 ${steps[activeStep].textColor}`} />
            })()}
          </div>
          
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
              <span className="text-sm font-medium text-slate-500">Step {activeStep + 1}</span>
              <div className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-sm font-medium text-slate-500">of {steps.length}</span>
            </div>
            
            <h4 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">
              {steps[activeStep].title}
            </h4>
            <p className="text-sm sm:text-base text-slate-600">
              {steps[activeStep].description}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Stats Bar - Bottom */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex justify-between">
          {stats.map((stat, index) => {
            const StatIcon = stat.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center"
              >
                <div className="flex items-center gap-1">
                  <StatIcon className={`w-4 h-4 ${stat.color}`} />
                  <div className="text-lg sm:text-xl font-bold text-slate-900">
                    {stat.value}
                  </div>
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  {stat.label}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Auto-progress indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-1">
        {steps.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveStep(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === activeStep ? 'bg-teal-500' : 'bg-slate-300'
            }`}
          />
        ))}
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-blue-100 to-transparent rounded-full -translate-x-10 -translate-y-10" />
      <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-teal-100 to-transparent rounded-full translate-x-10 translate-y-10" />
    </div>
  )
}