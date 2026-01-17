'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useLanguage } from '@/contexts/LanguageContext'
import { CountrySelect } from '@/components/CountrySelect'
import {
  D8_EMPLOYMENT_STATUSES,
  D8_MINIMUM_INCOME_EUR,
  PORTUGAL_MINIMUM_WAGE_EUR,
  PORTUGAL_VISAS,
  ELIGIBILITY_STATUSES,
  D8EmploymentStatus,
} from '@/lib/portugal-constants'
import {
  checkD8Eligibility,
  D8EligibilityInput,
  EligibilityResult,
} from '@/lib/portugal-visa-matcher'
import {
  Laptop,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Globe,
  Loader2,
  Save,
  TrendingUp,
  TrendingDown,
  Euro,
  Building,
  FileText,
  Wallet,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface D8EligibilityCheckerProps {
  onSave?: (result: EligibilityResult, input: D8EligibilityInput) => Promise<void>
  isSaving?: boolean
}

export function D8EligibilityChecker({ onSave, isSaving }: D8EligibilityCheckerProps) {
  const { language } = useLanguage()
  const visaInfo = PORTUGAL_VISAS.d8

  const [formData, setFormData] = useState<D8EligibilityInput>({
    employmentStatus: 'remote_employee',
    employerCountry: '',
    averageMonthlyIncome: 0,
    hasRemoteWorkContract: false,
    hasFiscalResidence: false,
    canWorkRemotely: true,
    hasAccommodation: false,
    hasCriminalRecord: false,
    hasHealthInsurance: false,
    hasBankStatements: false,
  })

  const [result, setResult] = useState<EligibilityResult | null>(null)

  // Income calculations
  const meetsIncome = formData.averageMonthlyIncome >= D8_MINIMUM_INCOME_EUR
  const incomeGap = D8_MINIMUM_INCOME_EUR - formData.averageMonthlyIncome
  const employerOutsidePortugal = formData.employerCountry.toLowerCase() !== 'portugal' && 
                                   formData.employerCountry.toLowerCase() !== 'pt' &&
                                   formData.employerCountry !== ''

  // Calculate eligibility on form change
  useEffect(() => {
    if (formData.employerCountry) {
      const eligibility = checkD8Eligibility(formData)
      setResult(eligibility)
    }
  }, [formData])

  const handleSave = async () => {
    if (result && onSave) {
      await onSave(result, formData)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'eligible':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'likely_eligible':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      case 'needs_more_info':
        return <AlertCircle className="h-5 w-5 text-amber-500" />
      default:
        return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'eligible':
        return 'border-green-500 bg-green-50 dark:bg-green-950/20'
      case 'likely_eligible':
        return 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
      case 'needs_more_info':
        return 'border-amber-500 bg-amber-50 dark:bg-amber-950/20'
      default:
        return 'border-red-500 bg-red-50 dark:bg-red-950/20'
    }
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Form */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Laptop className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>{language === 'ar' ? visaInfo.name.ar : visaInfo.name.en}</CardTitle>
                <CardDescription>
                  {language === 'ar' ? visaInfo.description.ar : visaInfo.description.en}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 text-sm">
              <Badge variant="secondary">
                {language === 'ar' ? 'الرسوم' : 'Fee'}: €{visaInfo.fee.amount}
              </Badge>
              <Badge variant="outline">
                {language === 'ar' ? 'المعالجة' : 'Processing'}: {visaInfo.processingTime}
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                {language === 'ar' ? 'مسار للإقامة الدائمة' : 'Path to PR'}
              </Badge>
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                {language === 'ar' ? 'يمكن العمل لجهات برتغالية أيضاً' : 'Can work for PT entities too'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Income Requirement Highlight */}
        <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/5 to-purple-500/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Euro className="h-5 w-5" />
              {language === 'ar' ? 'متطلبات الدخل' : 'Income Requirements'}
            </CardTitle>
            <CardDescription>
              {language === 'ar'
                ? `الحد الأدنى: 4 أضعاف الحد الأدنى للأجور (€${D8_MINIMUM_INCOME_EUR.toLocaleString()}/شهر)`
                : `Minimum: 4x minimum wage (€${D8_MINIMUM_INCOME_EUR.toLocaleString()}/month)`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Visual Income Comparison */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-background border text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  {language === 'ar' ? 'الحد الأدنى للأجور' : 'Minimum Wage'}
                </p>
                <p className="text-xl font-bold text-muted-foreground">€{PORTUGAL_MINIMUM_WAGE_EUR}</p>
                <p className="text-xs text-muted-foreground">×1</p>
              </div>
              <div className="p-4 rounded-lg bg-primary/10 border-2 border-primary text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  {language === 'ar' ? 'متطلب D8' : 'D8 Requirement'}
                </p>
                <p className="text-2xl font-bold text-primary">€{D8_MINIMUM_INCOME_EUR.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">×4</p>
              </div>
            </div>

            {/* Income Input */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                {language === 'ar' ? 'متوسط الدخل الشهري لآخر 3 أشهر (يورو)' : 'Average Monthly Income (Last 3 Months) - EUR'}
              </Label>
              <Input
                type="number"
                min="0"
                placeholder="e.g. 4500"
                value={formData.averageMonthlyIncome || ''}
                onChange={(e) =>
                  setFormData({ ...formData, averageMonthlyIncome: parseFloat(e.target.value) || 0 })
                }
              />
            </div>

            {/* Income Status */}
            {formData.averageMonthlyIncome > 0 && (
              <div className={`p-4 rounded-lg border-2 ${meetsIncome ? 'border-green-500 bg-green-50 dark:bg-green-950/30' : 'border-red-500 bg-red-50 dark:bg-red-950/30'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {meetsIncome ? (
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                    ) : (
                      <XCircle className="h-8 w-8 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium">
                        {meetsIncome
                          ? (language === 'ar' ? 'دخلك يفي بالمتطلبات!' : 'Your income meets requirements!')
                          : (language === 'ar' ? 'الدخل غير كافٍ' : 'Income not sufficient')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {meetsIncome
                          ? (language === 'ar'
                              ? `€${formData.averageMonthlyIncome.toLocaleString()} ≥ €${D8_MINIMUM_INCOME_EUR.toLocaleString()}`
                              : `€${formData.averageMonthlyIncome.toLocaleString()} ≥ €${D8_MINIMUM_INCOME_EUR.toLocaleString()}`)
                          : (language === 'ar'
                              ? `تحتاج €${incomeGap.toLocaleString()} إضافية`
                              : `You need €${incomeGap.toLocaleString()} more`)}
                      </p>
                    </div>
                  </div>
                  {meetsIncome ? (
                    <TrendingUp className="h-6 w-6 text-green-500" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-red-500" />
                  )}
                </div>
              </div>
            )}

            {/* D7 Alternative Suggestion */}
            {!meetsIncome && formData.averageMonthlyIncome >= PORTUGAL_MINIMUM_WAGE_EUR && (
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>💡 {language === 'ar' ? 'نصيحة' : 'Tip'}:</strong>{' '}
                  {language === 'ar'
                    ? `دخلك (€${formData.averageMonthlyIncome.toLocaleString()}) يفي بمتطلبات تأشيرة D7 (دخل سلبي). فكر في ذلك كبديل!`
                    : `Your income (€${formData.averageMonthlyIncome.toLocaleString()}) meets D7 visa requirements (passive income). Consider that as an alternative!`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Employer & Remote Work */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="h-5 w-5" />
              {language === 'ar' ? 'صاحب العمل والعمل عن بُعد' : 'Employer & Remote Work'}
            </CardTitle>
            <CardDescription>
              {language === 'ar'
                ? 'يجب أن يكون صاحب العمل خارج البرتغال'
                : 'Your employer must be based outside Portugal'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'نوع العمل' : 'Employment Status'}</Label>
              <Select
                value={formData.employmentStatus}
                onValueChange={(v: D8EmploymentStatus) =>
                  setFormData({ ...formData, employmentStatus: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(D8_EMPLOYMENT_STATUSES).map(([key, labels]) => (
                    <SelectItem key={key} value={key}>
                      {language === 'ar' ? labels.ar : labels.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                {language === 'ar' ? 'بلد صاحب العمل' : 'Employer Country'}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        {language === 'ar'
                          ? 'يجب أن يكون صاحب العمل خارج البرتغال. إذا كان في البرتغال، فكر في تأشيرة D1 بدلاً من ذلك.'
                          : 'Employer must be outside Portugal. If in Portugal, consider D1 visa instead.'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <CountrySelect
                value={formData.employerCountry}
                onValueChange={(v) => setFormData({ ...formData, employerCountry: v })}
                placeholder={language === 'ar' ? 'اختر بلد صاحب العمل' : 'Select employer country'}
                language={language}
              />
              
              {formData.employerCountry && (
                <div className="mt-2">
                  {employerOutsidePortugal ? (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {language === 'ar' ? 'صاحب العمل خارج البرتغال ✓' : 'Employer outside Portugal ✓'}
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      {language === 'ar' ? 'D8 تتطلب صاحب عمل خارج البرتغال' : 'D8 requires non-PT employer'}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Documentation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {language === 'ar' ? 'الوثائق المطلوبة' : 'Required Documentation'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{language === 'ar' ? 'لدي عقد/إثبات عمل عن بُعد' : 'I have remote work contract/proof'}</Label>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'عقد يوضح أن العمل يمكن أن يتم عن بُعد' : 'Contract showing work can be done remotely'}
                </p>
              </div>
              <Switch
                checked={formData.hasRemoteWorkContract}
                onCheckedChange={(v) => setFormData({ ...formData, hasRemoteWorkContract: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{language === 'ar' ? 'لدي كشوف حساب بنكية لآخر 3 أشهر' : 'I have bank statements (last 3 months)'}</Label>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'تظهر دخلك الشهري' : 'Showing your monthly income'}
                </p>
              </div>
              <Switch
                checked={formData.hasBankStatements}
                onCheckedChange={(v) => setFormData({ ...formData, hasBankStatements: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>{language === 'ar' ? 'لدي إثبات الإقامة الضريبية' : 'I have fiscal residence proof'}</Label>
              <Switch
                checked={formData.hasFiscalResidence}
                onCheckedChange={(v) => setFormData({ ...formData, hasFiscalResidence: v })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Label>{language === 'ar' ? 'لدي إثبات سكن في البرتغال' : 'I have accommodation in Portugal'}</Label>
              <Switch
                checked={formData.hasAccommodation}
                onCheckedChange={(v) => setFormData({ ...formData, hasAccommodation: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>{language === 'ar' ? 'لدي تأمين صحي/سفر صالح' : 'I have valid health/travel insurance'}</Label>
              <Switch
                checked={formData.hasHealthInsurance}
                onCheckedChange={(v) => setFormData({ ...formData, hasHealthInsurance: v })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Label className="text-red-600 dark:text-red-400">
                {language === 'ar' ? 'لدي سجل جنائي' : 'I have a criminal record'}
              </Label>
              <Switch
                checked={formData.hasCriminalRecord}
                onCheckedChange={(v) => setFormData({ ...formData, hasCriminalRecord: v })}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 space-y-4">
          {/* Eligibility Status */}
          {result && (
            <Card className={`border-2 ${getStatusColor(result.status)}`}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(result.status)}
                  {language === 'ar'
                    ? ELIGIBILITY_STATUSES[result.status].ar
                    : ELIGIBILITY_STATUSES[result.status].en}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <div className="text-4xl font-bold text-primary mb-2">{result.score}%</div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'درجة الأهلية' : 'Eligibility Score'}
                  </p>
                  <Progress value={result.score} className="mt-3" />
                </div>

                {onSave && (
                  <Button onClick={handleSave} className="w-full mt-4" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {language === 'ar' ? 'حفظ التقييم' : 'Save Assessment'}
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Key Requirements */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {language === 'ar' ? 'المتطلبات الأساسية' : 'Key Requirements'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Euro className="h-4 w-4" />
                  {language === 'ar' ? 'الدخل' : 'Income'}
                </span>
                {meetsIncome ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {language === 'ar' ? 'صاحب عمل خارج PT' : 'Non-PT Employer'}
                </span>
                {employerOutsidePortugal ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : formData.employerCountry ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {language === 'ar' ? 'عقد عمل' : 'Work Contract'}
                </span>
                {formData.hasRemoteWorkContract ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  {language === 'ar' ? 'كشوف بنكية' : 'Bank Statements'}
                </span>
                {formData.hasBankStatements ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Requirements Breakdown */}
          {result && result.breakdown.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {language === 'ar' ? 'تفاصيل المتطلبات' : 'Requirements Breakdown'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[300px] overflow-y-auto">
                {result.breakdown.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    {item.met ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-medium">{item.category}</p>
                      <p className="text-muted-foreground text-xs">
                        {language === 'ar' ? item.details.ar : item.details.en}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Missing Requirements */}
          {result && result.missingRequirements.length > 0 && (
            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {language === 'ar' ? 'المتطلبات المفقودة' : 'Missing Requirements'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {result.missingRequirements.map((req, idx) => (
                    <li key={idx} className="text-muted-foreground">
                      • {language === 'ar' ? req.ar : req.en}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {result && result.recommendations.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  {language === 'ar' ? 'توصيات' : 'Recommendations'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {result.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-muted-foreground">
                      • {language === 'ar' ? rec.ar : rec.en}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
