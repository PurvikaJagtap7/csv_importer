'use client';

import { useState, useCallback } from 'react';
import FileUpload from '@/components/FileUpload';
import PreviewTable from '@/components/PreviewTable';
import ProgressBar from '@/components/ProgressBar';
import ResultTable from '@/components/ResultTable';
import { parseCsvFile, ParseResult } from '@/lib/csvParse';
import { extractCsv } from '@/lib/api';
import { ExtractResponse } from '@/types/crm.types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { UsersIcon } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

type Step = 'upload' | 'preview' | 'loading' | 'result' | 'error';
type Section = 'import' | 'leads' | 'settings';

export default function HomePage() {
  const [currentSection, setCurrentSection] = useState<Section>('import');
  const [step, setStep] = useState<Step>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [uploadError, setUploadError] = useState<string>('');
  const [parseError, setParseError] = useState<string>('');
  const [extractResult, setExtractResult] = useState<ExtractResponse | null>(null);
  const [extractError, setExtractError] = useState<string>('');
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  // ── Step 1: File selected ─────────────────────────────────────────────────
  const handleFileSelect = useCallback(async (file: File) => {
    setUploadError('');
    setParseError('');

    const isValidExt = file.name.toLowerCase().endsWith('.csv');
    const isValidMime =
      file.type === 'text/csv' || file.type === 'application/vnd.ms-excel' || file.type === '';

    if (!isValidExt || !isValidMime) {
      setUploadError('Invalid file type. Please upload a .csv file.');
      return;
    }

    try {
      const result = await parseCsvFile(file);
      setSelectedFile(file);
      setParseResult(result);
      setStep('preview');
    } catch (err: any) {
      setParseError(`Failed to parse CSV: ${err?.message ?? 'Unknown error'}`);
    }
  }, []);

  // ── Step 2: Confirm → run extraction ─────────────────────────────────────
  const handleConfirmImport = useCallback(async () => {
    if (!selectedFile) return;
    setStep('loading');
    setBatchProgress({ current: 0, total: 0 });
    setExtractError('');

    try {
      const result = await extractCsv(selectedFile, (batchIndex, totalBatches) => {
        setBatchProgress({ current: batchIndex + 1, total: totalBatches });
      });
      setExtractResult(result);
      setStep('result');
      setCurrentSection('leads'); // Auto-navigate to Manage Leads page
    } catch (err: any) {
      setExtractError(err?.message ?? 'Extraction failed. Please try again.');
      setStep('error');
    }
  }, [selectedFile]);

  // ── Reset ─────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setStep('upload');
    setSelectedFile(null);
    setParseResult(null);
    setUploadError('');
    setParseError('');
    setExtractError('');
    setBatchProgress({ current: 0, total: 0 });
  }, []);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "260px",
          "--header-height": "56px",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
      />
      <SidebarInset className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex h-(--header-height) shrink-0 items-center justify-between border-b px-4 lg:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mx-2 h-4 data-vertical:self-auto" />
            <h1 className="text-sm font-semibold tracking-tight">
              {currentSection === 'import' && 'Import CSV'}
              {currentSection === 'leads' && 'Manage Leads'}
              {currentSection === 'settings' && 'Settings'}
            </h1>
          </div>
          <ThemeToggle />
        </header>

        {/* Main Content Area - Full width */}
        <main className="flex-1 p-6 space-y-6 w-full min-w-0 overflow-y-auto">
          {/* Section: Import CSV */}
          {currentSection === 'import' && (
            <div className="space-y-6">
              {step === 'upload' && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">Import contacts</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground mt-1">
                      Upload a CSV file — we'll map it to your CRM schema automatically.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileUpload
                      onFileSelect={handleFileSelect}
                      error={uploadError || parseError}
                    />
                  </CardContent>
                </Card>
              )}

              {step === 'preview' && parseResult && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-foreground">Preview</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Review your data before running AI extraction.
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={handleReset}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      ← Choose different file
                    </Button>
                  </div>

                  <PreviewTable headers={parseResult.headers} rows={parseResult.rows} />

                  <div className="flex justify-end">
                    <Button
                      id="confirm-import-btn"
                      onClick={handleConfirmImport}
                      size="default"
                      className="bg-primary text-primary-foreground hover:bg-primary/95 font-medium transition-colors"
                    >
                      Confirm Import
                    </Button>
                  </div>
                </div>
              )}

              {step === 'loading' && (
                <div className="flex flex-col items-center justify-center py-16">
                  <Card className="w-full max-w-md bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-foreground">Extracting data…</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground mt-1">
                        AI is mapping your CSV to the CRM schema. This may take a moment.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ProgressBar
                        current={batchProgress.current}
                        total={batchProgress.total}
                      />
                    </CardContent>
                  </Card>
                </div>
              )}

              {step === 'error' && (
                <Card className="border-destructive/30 bg-destructive/10 text-destructive p-6 space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Extraction failed</h2>
                    <p className="text-sm text-muted-foreground mt-1">{extractError}</p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleConfirmImport}
                      className="border-border text-foreground hover:bg-muted"
                    >
                      Retry
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleReset}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Start over
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Section: Manage Leads */}
          {currentSection === 'leads' && (
            <div className="space-y-6">
              {extractResult ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-foreground">Lead Import Results</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        AI extraction finished. Review the results below.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleReset();
                        setCurrentSection('import');
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Import another file
                    </Button>
                  </div>
                  <ResultTable result={extractResult} />
                </>
              ) : (
                <Card className="border border-dashed border-border py-12 flex flex-col items-center justify-center text-center">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
                    <UsersIcon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">No leads imported yet</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    Upload a CSV file and confirm the import to see your structured CRM records here.
                  </p>
                  <Button
                    onClick={() => setCurrentSection('import')}
                    className="mt-4"
                  >
                    Go to Import
                  </Button>
                </Card>
              )}
            </div>
          )}

          {/* Section: Settings */}
          {currentSection === 'settings' && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">Settings</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Configure GrowEasy CRM importer properties.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border border-dashed rounded-lg text-center text-sm text-muted-foreground">
                  Settings are currently read-only. Standard configuration parameters (batch size, custom fields mapping) can be customized here in future releases.
                </div>
              </CardContent>
            </Card>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-border/50 py-4 px-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} GrowEasy CRM. All rights reserved.
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
