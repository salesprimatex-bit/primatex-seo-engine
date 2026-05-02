/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { generateArticle } from "./lib/gemini";
import { ArticleFormData } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Loader2, 
  RefreshCw,
  Copy, 
  Check, 
  FileText, 
  Settings, 
  Send, 
  ExternalLink, 
  Download, 
  Code, 
  FileCode, 
  Table,
  ChevronDown 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";
import { marked } from "marked";

export default function App() {
  const [formData, setFormData] = useState<ArticleFormData>({
    keywordUtama: "",
    keywordArtikelUtama: "",
    urlArtikelUtama: "",
    keywordPilar: "",
    urlArtikelPilar: "",
  });

  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendSuccess, setSendSuccess] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState("");
  const [copiedArticle, setCopiedArticle] = useState(false);
  const [copiedSeo, setCopiedSeo] = useState(false);
  const [copiedSheet, setCopiedSheet] = useState(false);

  const autoSendToSheet = async (content: string) => {
    if (isSending) return;
    
    setIsSending(true);
    setSendError("");
    setSendSuccess(false);

    try {
      const parts = content.split("---SEO-DATA-START---");
      const articleMarkdown = parts[0] || "";
      const seoDataMarkdown = parts[1] || "";
      
      const articleHtml = marked.parse(articleMarkdown) as string;
      const cleanSeoData = seoDataMarkdown.replace(/DATA SEO YANG DIBUTUHKAN:/i, "").trim();
      const seoCells = cleanSeoData.split("\t").map(c => c.trim());

      const payload = {
        konten: articleHtml,
        judul: seoCells[0] || "",
        judul_s: seoCells[1] || "",
        slug: seoCells[2] || "",
        meta_: seoCells[3] || "",
        kutipan: seoCells[4] || "",
        tag: seoCells[5] || ""
      };

      // Call our backend API instead of fetching GAS directly
      const response = await fetch("/api/send-to-sheet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Gagal mengirim data.");
      }

      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (error: any) {
      console.error("Error sending to sheet:", error);
      setSendError(error.message || "Gagal mengirim data otomatis ke Sheet.");
    } finally {
      setIsSending(false);
    }
  };

  // Common regeneration logic
  const handleRegenerate = async (data: ArticleFormData) => {
    if (isGenerating) return;
    setIsGenerating(true);
    setSendError("");
    try {
      const article = await generateArticle(data);
      setResult(article);
      // Automatically trigger downloads
      triggerDownloads(article);
      // Automatically send to sheet
      autoSendToSheet(article);
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat membuat artikel. Silakan coba lagi.");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const frasa = params.get("frasa");
    const anchor1 = params.get("anchor1");
    const url1 = params.get("url1");
    const anchor2 = params.get("anchor2");
    const url2 = params.get("url2");

    if (frasa || anchor1 || url1 || anchor2 || url2) {
      const initialData = {
        keywordUtama: frasa || "",
        keywordArtikelUtama: anchor1 || "",
        urlArtikelUtama: url1 || "",
        keywordPilar: anchor2 || "",
        urlArtikelPilar: url2 || ""
      };
      
      setFormData(initialData);

      // Auto generate if main keyword is present
      if (frasa) {
        handleRegenerate(initialData);
      }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleRegenerate(formData);
  };

  const triggerDownloads = (content: string) => {
    // Split content into Article and SEO Data using the new robust delimiter
    const parts = content.split("---SEO-DATA-START---");
    const articleMarkdown = parts[0] || "";
    const seoDataMarkdown = parts[1] || "";

    // Try to extract "Judul Artikel" from the SEO data for filename
    let extractedTitle = "";
    if (seoDataMarkdown) {
      const lines = seoDataMarkdown.trim().split("\n");
      // Find the first line that contains a tab character (the TSV data row)
      const dataRow = lines.find(line => line.includes("\t")) || "";

      if (dataRow) {
        // Split by tab (\t) for TSV
        const cells = dataRow.split("\t").map(c => c.trim()).filter(c => c !== "");
        if (cells.length > 0) {
          extractedTitle = cells[0];
        }
      }
    }

    const baseFilename = (extractedTitle || formData.keywordUtama)
      .replace(/[\\/:*?"<>|]/g, "")
      .trim() || "artikel";

    // 1. Download Article as HTML
    const articleHtml = marked.parse(articleMarkdown);
    const fullHtml = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${extractedTitle || formData.keywordUtama || "Artikel SEO Primatex"}</title>
    <style>
        body { font-family: sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #333; }
        h1 { color: #1a1a1a; font-size: 2.5em; }
        h2 { color: #2c3e50; margin-top: 1.5em; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        h3 { color: #34495e; margin-top: 1.2em; }
        a { color: #2563eb; text-decoration: none; }
        a:hover { text-decoration: underline; }
        ul, ol { margin-bottom: 1em; }
        li { margin-bottom: 0.5em; }
    </style>
</head>
<body>
    ${articleHtml}
</body>
</html>`;
    
    // Trigger first download
    downloadFile(fullHtml, `${baseFilename}.html`, "text/html");

    // 2. Download SEO Data as Text with a delay
    if (seoDataMarkdown.trim()) {
      setTimeout(() => {
        // Clean up the "DATA SEO YANG DIBUTUHKAN:" header if it's there
        const cleanSeoData = seoDataMarkdown.replace(/DATA SEO YANG DIBUTUHKAN:/i, "").trim();
        downloadFile(cleanSeoData, `${baseFilename}.txt`, "text/plain");
      }, 800);
    }
  };

  const copyArticleHtml = () => {
    const parts = result.split("---SEO-DATA-START---");
    const articleMarkdown = parts[0] || "";
    const articleHtml = marked.parse(articleMarkdown);
    navigator.clipboard.writeText(articleHtml as string);
    setCopiedArticle(true);
    setTimeout(() => setCopiedArticle(false), 2000);
  };

  const copySeoTxt = () => {
    const parts = result.split("---SEO-DATA-START---");
    const seoDataMarkdown = parts[1] || "";
    const cleanSeoData = seoDataMarkdown.replace(/DATA SEO YANG DIBUTUHKAN:/i, "").trim();
    navigator.clipboard.writeText(cleanSeoData);
    setCopiedSeo(true);
    setTimeout(() => setCopiedSeo(false), 2000);
  };

  const copyForSpreadsheet = () => {
    const parts = result.split("---SEO-DATA-START---");
    const articleMarkdown = parts[0] || "";
    const seoDataMarkdown = parts[1] || "";
    
    const articleHtml = marked.parse(articleMarkdown) as string;
    const cleanSeoData = seoDataMarkdown.replace(/DATA SEO YANG DIBUTUHKAN:/i, "").trim();
    
    // Escape double quotes in HTML and wrap it to keep it in one cell
    // Also remove potential tabs in HTML to not break TSV structure
    const safeHtml = `"${articleHtml.replace(/"/g, '""')}"`;
    
    // Combine: HTML (Col G) + SEO Data (Col H-M)
    const combined = `${safeHtml}\t${cleanSeoData}`;
    
    navigator.clipboard.writeText(combined);
    setCopiedSheet(true);
    setTimeout(() => setCopiedSheet(false), 2000);
  };

  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadHTML = () => {
    triggerDownloads(result);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="text-white w-5 h-5" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">Primatex <span className="text-muted-foreground font-normal">SEO Engine</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="https://primatex.co.id" 
              target="_blank" 
              rel="noreferrer" 
              className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Website <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-none shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="w-4 h-4 text-primary" />
                  Konfigurasi Artikel
                </CardTitle>
                <CardDescription>
                  Masukkan kata kunci dan URL untuk optimasi SEO.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="keywordUtama">Frasa Kunci</Label>
                    <Input
                      id="keywordUtama"
                      name="keywordUtama"
                      placeholder="Contoh: Jual Geotextile Woven"
                      value={formData.keywordUtama}
                      onChange={handleInputChange}
                      required
                      className="bg-[#F9F9F9]"
                    />
                  </div>

                  <div className="pt-4 border-t border-border">
                    <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Internal Link 1 (Artikel Utama)</Label>
                    <div className="space-y-2 mt-2">
                      <Label htmlFor="keywordArtikelUtama" className="text-xs">Anchor Text 1</Label>
                      <Input
                        id="keywordArtikelUtama"
                        name="keywordArtikelUtama"
                        placeholder="Keyword Artikel Utama"
                        value={formData.keywordArtikelUtama}
                        onChange={handleInputChange}
                        required
                        className="bg-[#F9F9F9]"
                      />
                    </div>
                    <div className="space-y-2 mt-2">
                      <Label htmlFor="urlArtikelUtama" className="text-xs">Url 1</Label>
                      <Input
                        id="urlArtikelUtama"
                        name="urlArtikelUtama"
                        placeholder="https://primatex.co.id/..."
                        value={formData.urlArtikelUtama}
                        onChange={handleInputChange}
                        required
                        className="bg-[#F9F9F9]"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Internal Link 2 (Artikel Pilar)</Label>
                    <div className="space-y-2 mt-2">
                      <Label htmlFor="keywordPilar" className="text-xs">Anchor Text 2</Label>
                      <Input
                        id="keywordPilar"
                        name="keywordPilar"
                        placeholder="Keyword Artikel Pilar"
                        value={formData.keywordPilar}
                        onChange={handleInputChange}
                        required
                        className="bg-[#F9F9F9]"
                      />
                    </div>
                    <div className="space-y-2 mt-2">
                      <Label htmlFor="urlArtikelPilar" className="text-xs">Url 2</Label>
                      <Input
                        id="urlArtikelPilar"
                        name="urlArtikelPilar"
                        placeholder="https://primatex.co.id/..."
                        value={formData.urlArtikelPilar}
                        onChange={handleInputChange}
                        required
                        className="bg-[#F9F9F9]"
                      />
                    </div>
                  </div>

                  <div className="min-h-[20px] mt-1 text-center">
                    {sendError && <p className="text-[10px] text-red-500 font-medium">{sendError}</p>}
                    {sendSuccess && (
                      <motion.p 
                        initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                        className="text-[10px] text-green-600 font-bold flex items-center justify-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Data terkirim ke Sheet!
                      </motion.p>
                    )}
                    {isSending && (
                      <p className="text-[10px] text-blue-500 animate-pulse flex items-center justify-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Mengirim data...
                      </p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full mt-6 h-11 text-base font-medium" 
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sedang Regenerasi...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Regenerate Artikel
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
              <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                Standar Kualitas SEO
              </h3>
              <ul className="text-xs space-y-2 text-muted-foreground">
                <li>• Panjang 1.000 - 1.500 kata</li>
                <li>• Struktur H1, H2, H3 yang rapi</li>
                <li>• Paragraf panjang & mendalam (Anti-Thin)</li>
                <li>• Internal & Outbound Linking otomatis</li>
                <li>• CTA Primatex yang terintegrasi</li>
                <li>• Gaya bahasa profesional & teknis</li>
              </ul>
            </div>
          </div>

          {/* Output Section */}
          <div className="lg:col-span-8">
            <Card className="border-none shadow-sm bg-white h-full flex flex-col min-h-[600px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
                <div>
                  <CardTitle className="text-lg">Hasil Generasi</CardTitle>
                  <CardDescription>
                    Konten artikel dalam format Preview dan HTML.
                  </CardDescription>
                </div>
                {result && (
                  <div className="flex items-center gap-2">
                    <Button variant="default" size="sm" onClick={handleDownloadHTML} className="gap-2">
                      <Download className="w-4 h-4" />
                      Download Files
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden">
                <AnimatePresence mode="wait">
                  {!result && !isGenerating ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4"
                    >
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                        <FileText className="w-8 h-8 text-muted-foreground opacity-20" />
                      </div>
                      <div>
                        <p className="text-muted-foreground font-medium">Belum ada konten yang dihasilkan.</p>
                        <p className="text-xs text-muted-foreground/60 max-w-[280px] mt-1">
                          Isi formulir di sebelah kiri dan klik "Generate Artikel" untuk memulai.
                        </p>
                      </div>
                    </motion.div>
                  ) : isGenerating ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col items-center justify-center p-12 space-y-6"
                    >
                      <div className="relative">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                        </div>
                      </div>
                      <div className="text-center space-y-2">
                        <p className="font-medium animate-pulse">AI sedang menyusun artikel teknis...</p>
                        <p className="text-xs text-muted-foreground max-w-[320px]">
                          Proses ini memakan waktu sekitar 30-60 detik untuk memastikan kualitas konten dan optimasi SEO yang mendalam.
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="h-full flex flex-col"
                    >
                      <Tabs defaultValue="preview" className="w-full flex-1 flex flex-col">
                        <div className="px-6 py-2 border-b bg-muted/30 flex items-center justify-between">
                          <TabsList className="bg-transparent gap-4">
                            <TabsTrigger value="preview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Preview</TabsTrigger>
                            <TabsTrigger value="html" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">HTML Code</TabsTrigger>
                          </TabsList>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => autoSendToSheet(result)} 
                              disabled={isSending}
                              className="gap-2 h-8 text-xs font-bold border-blue-200 bg-blue-50/50 hover:bg-blue-100/50 text-blue-700 transition-all"
                            >
                              {isSending ? <Loader2 className="w-3 h-3 animate-spin" /> : (sendSuccess ? <Check className="w-3 h-3 text-green-500" /> : <Send className="w-3 h-3" />)}
                              {isSending ? "Mengirim..." : (sendSuccess ? "Data Terkirim" : "Kirim ke Sheet")}
                            </Button>
                            <Button variant="outline" size="sm" onClick={copyForSpreadsheet} className="gap-2 h-8 text-xs font-bold border-green-200 bg-green-50/50 hover:bg-green-100/50 text-green-700 transition-all">
                              {copiedSheet ? <Check className="w-3 h-3" /> : <Table className="w-3 h-3" />}
                              {copiedSheet ? "Data Baris Tersalin" : "Salin Baris Spreadsheet (G-M)"}
                            </Button>
                            <Button variant="outline" size="sm" onClick={copyArticleHtml} className="gap-2 h-8 text-xs font-normal border-border/50 hover:bg-white transition-all">
                              {copiedArticle ? <Check className="w-3 h-3 text-green-500" /> : <FileCode className="w-3 h-3 text-primary" />}
                              {copiedArticle ? "HTML Tersalin" : "Salin HTML (Artikel)"}
                            </Button>
                            <Button variant="outline" size="sm" onClick={copySeoTxt} className="gap-2 h-8 text-xs font-normal border-border/50 hover:bg-white transition-all">
                              {copiedSeo ? <Check className="w-3 h-3 text-green-500" /> : <FileText className="w-3 h-3 text-blue-500" />}
                              {copiedSeo ? "Data SEO Tersalin" : "Salin Data SEO (TXT)"}
                            </Button>
                          </div>
                        </div>
                        <ScrollArea className="flex-1 h-[calc(100vh-320px)]">
                          <TabsContent value="preview" className="p-6 m-0 space-y-8">
                            {/* Article Section */}
                            <div className="bg-white rounded-xl shadow-sm border border-border p-8 prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
                              <ReactMarkdown>{result.split("---SEO-DATA-START---")[0]}</ReactMarkdown>
                            </div>

                            {/* SEO Data Section */}
                            {result.includes("---SEO-DATA-START---") && (
                              <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-8">
                                <div className="flex items-center justify-between mb-6">
                                  <div className="space-y-1">
                                    <h3 className="m-0 text-xl font-bold text-blue-900">DATA SEO YANG DIBUTUHKAN</h3>
                                    <p className="text-xs text-blue-600/80">Data ini siap untuk ditempel ke spreadsheet atau CMS Anda.</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => autoSendToSheet(result)} 
                                      disabled={isSending}
                                      className="gap-2 h-9 border-blue-200 bg-white hover:bg-blue-50 text-blue-800 font-bold"
                                    >
                                      {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : (sendSuccess ? <Check className="w-4 h-4 text-green-500" /> : <Send className="w-4 h-4" />)}
                                      {isSending ? "Sedang Mengirim..." : (sendSuccess ? "Berhasil dikirim" : "Kirim ke Spreadsheet")}
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={copyForSpreadsheet} className="gap-2 h-9 bg-white border-green-200 hover:bg-green-50 text-green-700 font-bold">
                                      {copiedSheet ? <Check className="w-4 h-4 text-green-500" /> : <Table className="w-4 h-4" />}
                                      {copiedSheet ? "Data Berhasil Tersalin" : "Salin untuk Spreadsheet (G-M)"}
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={copySeoTxt} className="gap-2 h-9 bg-white border-blue-200 hover:bg-blue-50 text-blue-700">
                                      {copiedSeo ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                      {copiedSeo ? "Data SEO Tersalin" : "Salin Data SEO (TXT)"}
                                    </Button>
                                  </div>
                                </div>
                                <div 
                                  className="p-5 bg-white rounded-lg overflow-x-auto font-mono text-sm whitespace-pre border border-blue-100 shadow-inner text-blue-900"
                                  style={{ tabSize: 8 }}
                                >
                                  {result.split("---SEO-DATA-START---")[1].replace(/DATA SEO YANG DIBUTUHKAN:/i, "").trim()}
                                </div>
                              </div>
                            )}
                          </TabsContent>
                          <TabsContent value="html" className="p-6 m-0">
                            <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden">
                              <div className="flex items-center justify-between p-4 bg-slate-800/50 border-b border-slate-700">
                                <div className="flex items-center gap-2 text-xs text-slate-300">
                                  <Code className="w-4 h-4 text-blue-400" />
                                  <span>Raw HTML structure for your CMS or blog.</span>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={copyArticleHtml} 
                                  className="gap-2 h-8 text-xs text-slate-300 hover:bg-slate-700 hover:text-white"
                                >
                                  {copiedArticle ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                  {copiedArticle ? "HTML Tersalin" : "Salin HTML"}
                                </Button>
                              </div>
                              <div className="p-6 font-mono text-sm text-slate-300 whitespace-pre-wrap selection:bg-blue-500/30 max-h-[600px] overflow-y-auto custom-scrollbar">
                                {marked.parse(result.split("---SEO-DATA-START---")[0])}
                              </div>
                            </div>
                          </TabsContent>
                        </ScrollArea>
                      </Tabs>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="border-t border-border mt-12 py-8 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2026 Primatex SEO Content Engine. Dikembangkan untuk efisiensi tim konten konstruksi.
          </p>
        </div>
      </footer>
    </div>
  );
}
