import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVerification } from '@/hooks/useVerification';
import { FileDropzone } from '@/components/upload/FileDropzone';
import { FilePreview } from '@/components/upload/FilePreview';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { ProgressSection } from '@/components/dashboard/ProgressSection';
import { ControlBar } from '@/components/dashboard/ControlBar';
import { LiveLogs } from '@/components/dashboard/LiveLogs';
import { ResultsTable } from '@/components/dashboard/ResultsTable';
import { StatusChart } from '@/components/dashboard/StatusChart';
import { ExportPanel } from '@/components/export/ExportPanel';

export default function DashboardPage() {
  const {
    activeJobId,
    job,
    stats,
    progress,
    logs,
    results,
    totalResults,
    currentPage,
    statusFilter,
    searchQuery,
    uploadData,
    isUploading,
    setStatusFilter,
    setSearchQuery,
    loadResults,
    handleUpload,
    startVerification,
    pauseVerification,
    resumeVerification,
    cancelVerification,
  } = useVerification();

  useEffect(() => {
    if (activeJobId && (job?.status !== 'pending')) {
      loadResults(currentPage, statusFilter, searchQuery);
    }
  }, [activeJobId, job?.status, currentPage, statusFilter, searchQuery, loadResults]);

  const showDropzone = !activeJobId;
  const showPreview = activeJobId && uploadData && (!job || job.status === 'pending');
  const isVerifyingOrDone = activeJobId && job && job.status !== 'pending';
  const isCompleted = job?.status === 'completed';

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {showDropzone && (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[60vh]"
          >
            <div className="text-center mb-8 space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">Verify Your Email List</h1>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Upload your CSV file to get started. We'll clean, verify, and validate your email addresses in real-time.
              </p>
            </div>
            <FileDropzone onUploadSuccess={handleUpload} isUploading={isUploading} />
          </motion.div>
        )}

        {showPreview && uploadData && (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <FilePreview uploadData={uploadData} onStart={startVerification} />
          </motion.div>
        )}

        {isVerifyingOrDone && (
          <motion.div
            key="dashboard"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            <motion.div variants={itemVariants} className="flex justify-between items-center">
              <h2 className="text-2xl font-bold tracking-tight">Verification Dashboard</h2>
              <ControlBar 
                job={job} 
                onPause={pauseVerification} 
                onResume={resumeVerification} 
                onCancel={cancelVerification} 
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <ProgressSection progress={progress} />
            </motion.div>

            <motion.div variants={itemVariants}>
              <StatsCards stats={stats} />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div variants={itemVariants} className="lg:col-span-2 h-[450px]">
                <LiveLogs logs={logs} />
              </motion.div>
              <motion.div variants={itemVariants} className="flex flex-col gap-6">
                <StatusChart stats={stats} />
                {isCompleted && <ExportPanel jobId={activeJobId} stats={stats} />}
              </motion.div>
            </div>

            <motion.div variants={itemVariants}>
              <ResultsTable 
                results={results}
                totalCount={totalResults}
                currentPage={currentPage}
                onPageChange={(page) => loadResults(page, statusFilter, searchQuery)}
                onSearch={setSearchQuery}
                onFilterChange={setStatusFilter}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
