import React from 'react'
import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'

const AdminLoading = () => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 mx-auto mb-4 text-blue-400"
        >
          <RefreshCw className="w-full h-full" />
        </motion.div>
        
        <h3 className="text-lg font-semibold text-white mb-2">Loading Dashboard</h3>
        <p className="text-slate-400 text-sm">
          Fetching stats and checking API health...
        </p>
      </motion.div>
    </div>
  )
}

export default AdminLoading