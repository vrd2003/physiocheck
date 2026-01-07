'use client'

import { motion } from 'framer-motion'
import { Activity, Shield, Users, Video, ArrowRight, Heart } from 'lucide-react'
import Link from 'next/link'
import { PhysioAnimation } from '@/components/animations/HeroAnimation'
import { Card } from '@/components/cards/Card'

export default function HomePage() {
  const features = [
    {
      icon: <Activity className="w-8 h-8" />,
      title: 'Real-time Monitoring',
      description: 'Live posture feedback with AI-powered analysis',
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Medical Grade',
      description: 'Trusted by healthcare professionals worldwide',
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Doctor-Patient Sync',
      description: 'Seamless communication and progress tracking',
    },
    {
      icon: <Video className="w-8 h-8" />,
      title: 'Guided Sessions',
      description: 'Step-by-step exercise instructions',
    },
  ]

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-teal-100 text-teal-800 mb-6">
                <Heart className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Trusted by 500+ Medical Professionals</span>
              </div>
              
              <h1 className="text-5xl font-bold text-slate-900 mb-6">
                Professional{' '}
                <span className="text-teal-600">Physiotherapy</span>
                <br />
                In Your Hands
              </h1>
              
              <p className="text-xl text-slate-600 mb-8">
                AI-powered rehabilitation platform connecting doctors with patients for effective, 
                monitored recovery journeys.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center px-8 py-3 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors duration-300"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  href="/public/exercises"
                  className="inline-flex items-center px-8 py-3 rounded-lg border-2 border-teal-600 text-teal-600 font-semibold hover:bg-teal-50 transition-colors duration-300"
                >
                  Browse Exercises
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
            >
              <PhysioAnimation />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Everything You Need for Effective Rehabilitation
            </h2>
            <p className="text-xl text-slate-600">
              Comprehensive tools for modern physiotherapy
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300">
                  <div className="p-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-teal-100 text-teal-600 mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600">
                      {feature.description}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-slate-900 mb-6">
              Ready to Transform Your Practice?
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Join thousands of healthcare professionals using PhysioCheck to deliver better patient outcomes.
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center px-10 py-4 rounded-lg bg-teal-600 text-white font-semibold text-lg hover:bg-teal-700 transition-all duration-300 hover:scale-105"
            >
              Start Free Trial
              <ArrowRight className="ml-3 w-6 h-6" />
            </Link>
            <p className="mt-4 text-slate-500">
              No credit card required • 14-day free trial
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
