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
import {
  D7_INCOME_SOURCES,
  D7_INCOME_REQUIREMENTS,
  PORTUGAL_VISAS,
  ELIGIBILITY_STATUSES,
  calculateD7RequiredIncome,
  D7IncomeSource,
} from '@/lib/portugal-constants'
import {
  checkD7Eligibility,
  D7EligibilityInput,
  EligibilityResult,
} from '@/lib/portugal-visa-matcher'
import {
  Wallet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Users,
  Calculator,
  Loader2,
  Save,
  TrendingUp,
  TrendingDown,
  Euro,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface D7EligibilityCheckerProps {
  onSave?: (result: EligibilityResult, input: D7EligibilityInput) => Promise<void>
  isSaving?: boolean
}

export function D7EligibilityChecker({ onSave, isSaving }: D7EligibilityCheckerProps) {
  const { language } = useLanguage()
  const visaInfo = PORTUGAL_VISAS.d7

  const [formData, setFormData] = useState<D7EligibilityInput>({
    incomeSource: 'pension',
    monthlyIncome: 0,
    adultDependents: 0,
    childDependents: 0,
    hasIncomeDocumentation: false,
    hasAccommodation: false,
    hasCriminalRecord: false,
    hasHealthInsurance: false,
  })

  const [result, setResult] = useState<EligibilityResult | null>(null)

  // Calculate required income dynamically
  const requiredIncome = calculateD7RequiredIncome(formData.adultDependents, formData.childDependents)
  const incomeGap = requiredIncome - formData.monthlyIncome
  const meetsIncome = formData.monthlyIncome >= requiredIncome

  // Calculate eligibility on form change
  useEffect(() => {
    const eligibility = checkD7Eligibility(formData)
    setResult(eligibility)
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
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-primary" />
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
            </div>
          </CardContent>
        </Card>

        {/* Income Calculator Card - Highlighted */}
        <Card className="border-2 border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              {language === 'ar' ? 'حاسبة الدخل المطلوب' : 'Required Income Calculator'}
            </CardTitle>
            <CardDescription>
              {language === 'ar'
                ? 'الحد الأدنى للدخل يعتمد على عدد المعالين'
                : 'Minimum income depends on number of dependents'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Income Breakdown Visual */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-background border">
                <p className="text-xs text-muted-foreground mb-1">
                  {language === 'ar' ? 'مقدم الطلب' : 'Main Applicant'}
                </p>
                <p className="text-xl font-bold text-primary">€{D7_INCOME_REQUIREMENTS.mainApplicant}</p>
                <p className="text-xs text-muted-foreground">100%</p>
              </div>
              <div className="p-4 rounded-lg bg-background border">
                <p className="text-xs text-muted-foreground mb-1">
                  {language === 'ar' ? 'كل بالغ معال' : 'Each Adult'}
                </p>
                <p className="text-xl font-bold text-blue-600">+€{D7_INCOME_REQUIREMENTS.firstAdultDependent}</p>
                <p className="text-xs text-muted-foreground">+50%</p>
              </div>
              <div className="p-4 rounded-lg bg-background border">
                <p className="text-xs text-muted-foreground mb-1">
                  {language === 'ar' ? 'كل طفل' : 'Each Child'}
                </p>
                <p className="text-xl font-bold text-purple-600">+€{D7_INCOME_REQUIREMENTS.childDependent}</p>
                <p className="text-xs text-muted-foreground">+30%</p>
              </div>
            </div>

            {/* Dependents Input */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {language === 'ar' ? 'المعالون البالغون' : 'Adult Dependents'}
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.adultDependents}
                  onChange={(e) =>
                    setFormData({ ...formData, adultDependents: parseInt(e.target.value) || 0 })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {language === 'ar' ? 'الزوج/ة أو الوالدين' : 'Spouse or parents'}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {language === 'ar' ? 'الأطفال المعالون' : 'Child Dependents'}
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.childDependents}
                  onChange={(e) =>
                    setFormData({ ...formData, childDependents: parseInt(e.target.value) || 0 })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {language === 'ar' ? 'أقل من 18 سنة' : 'Under 18 years old'}
                </p>
              </div>
            </div>

            {/* Required Income Summary */}
            <div className={`p-4 rounded-lg border-2 ${meetsIncome ? 'border-green-500 bg-green-50 dark:bg-green-950/30' : 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {language === 'ar' ? 'الدخل الشهري المطلوب' : 'Required Monthly Income'}
                  </p>
                  <p className="text-3xl font-bold text-primary">€{requiredIncome.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  {meetsIncome ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <TrendingUp className="h-5 w-5" />
                      <span className="font-medium">{language === 'ar' ? 'مستوفى' : 'Met'}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-600">
                      <TrendingDown className="h-5 w-5" />
                      <span className="font-medium">€{incomeGap.toLocaleString()} {language === 'ar' ? 'نقص' : 'gap'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Income Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Euro className="h-5 w-5" />
              {language === 'ar' ? 'تفاصيل الدخل السلبي' : 'Passive Income Details'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'مصدر الدخل' : 'Income Source'}</Label>
              <Select
                value={formData.incomeSource}
                onValueChange={(v: D7IncomeSource) =>
                  setFormData({ ...formData, incomeSource: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(D7_INCOME_SOURCES).map(([key, labels]) => (
                    <SelectItem key={key} value={key}>
                      {language === 'ar' ? labels.ar : labels.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                {language === 'ar' ? 'الدخل الشهري (يورو)' : 'Monthly Income (EUR)'}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        {language === 'ar'
                          ? 'يجب أن يكون الدخل سلبياً (بدون عمل نشط) ومستقراً ومتكرراً'
                          : 'Income must be passive (no active work), stable, and recurring'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                type="number"
                min="0"
                placeholder="e.g. 1500"
                value={formData.monthlyIncome || ''}
                onChange={(e) =>
                  setFormData({ ...formData, monthlyIncome: parseFloat(e.target.value) || 0 })
                }
              />
              {formData.monthlyIncome > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  {meetsIncome ? (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {language === 'ar' ? 'يفي بالمتطلبات' : 'Meets requirement'}
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {language === 'ar' ? `نقص €${incomeGap.toLocaleString()}` : `€${incomeGap.toLocaleString()} short`}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{language === 'ar' ? 'لدي وثائق إثبات الدخل' : 'I have income documentation'}</Label>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar'
                    ? 'كشوف حساب بنكية، شهادة تقاعد، عقود إيجار'
                    : 'Bank statements, pension certificate, rental contracts'}
                </p>
              </div>
              <Switch
                checked={formData.hasIncomeDocumentation}
                onCheckedChange={(v) => setFormData({ ...formData, hasIncomeDocumentation: v })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Other Requirements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {language === 'ar' ? 'متطلبات أخرى' : 'Other Requirements'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>{language === 'ar' ? 'لدي إثبات سكن في البرتغال' : 'I have accommodation proof in Portugal'}</Label>
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
              <div className="space-y-0.5">
                <Label className="text-red-600 dark:text-red-400">
                  {language === 'ar' ? 'لدي سجل جنائي' : 'I have a criminal record'}
                </Label>
              </div>
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

          {/* Income Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {language === 'ar' ? 'ملخص الدخل' : 'Income Summary'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{language === 'ar' ? 'دخلك' : 'Your Income'}</span>
                <span className="font-medium">€{formData.monthlyIncome.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{language === 'ar' ? 'المطلوب' : 'Required'}</span>
                <span className="font-medium">€{requiredIncome.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{language === 'ar' ? 'الفرق' : 'Difference'}</span>
                <span className={`font-bold ${meetsIncome ? 'text-green-600' : 'text-red-600'}`}>
                  {meetsIncome ? '+' : ''}€{(formData.monthlyIncome - requiredIncome).toLocaleString()}
                </span>
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
              <CardContent className="space-y-3">
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
        </div>
      </div>
    </div>
  )
}
