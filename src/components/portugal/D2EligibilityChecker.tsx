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
  D2_EMPLOYMENT_TYPES,
  PORTUGAL_VISAS,
  ELIGIBILITY_STATUSES,
  D2EmploymentType,
} from '@/lib/portugal-constants'
import {
  checkD2Eligibility,
  D2EligibilityInput,
  EligibilityResult,
} from '@/lib/portugal-visa-matcher'
import {
  Briefcase,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Building2,
  FileText,
  Loader2,
  Save,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface D2EligibilityCheckerProps {
  onSave?: (result: EligibilityResult, input: D2EligibilityInput) => Promise<void>
  isSaving?: boolean
}

export function D2EligibilityChecker({ onSave, isSaving }: D2EligibilityCheckerProps) {
  const { language } = useLanguage()
  const visaInfo = PORTUGAL_VISAS.d2

  const [formData, setFormData] = useState<D2EligibilityInput>({
    employmentType: 'freelancer',
    hasInvestment: false,
    investmentAmount: undefined,
    hasBusinessPlan: false,
    hasServiceContract: false,
    hasProfessionalQualification: false,
    hasFinancialMeansInPortugal: false,
    hasAccommodation: false,
    hasCriminalRecord: false,
    hasHealthInsurance: false,
  })

  const [result, setResult] = useState<EligibilityResult | null>(null)

  // Calculate eligibility on form change
  useEffect(() => {
    const eligibility = checkD2Eligibility(formData)
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
                <Briefcase className="h-6 w-6 text-primary" />
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
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {language === 'ar' ? 'الرسوم' : 'Fee'}: €{visaInfo.fee.amount}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {language === 'ar' ? 'المعالجة' : 'Processing'}: {visaInfo.processingTime}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                  {language === 'ar' ? 'مسار للإقامة الدائمة' : 'Path to PR'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employment Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {language === 'ar' ? 'نوع العمل' : 'Employment Type'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'ما هو نوع عملك؟' : 'What type of work will you do?'}</Label>
              <Select
                value={formData.employmentType}
                onValueChange={(v: D2EmploymentType) =>
                  setFormData({ ...formData, employmentType: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(D2_EMPLOYMENT_TYPES).map(([key, labels]) => (
                    <SelectItem key={key} value={key}>
                      {language === 'ar' ? labels.ar : labels.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Business/Investment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {language === 'ar' ? 'خطة العمل / الاستثمار' : 'Business Plan / Investment'}
            </CardTitle>
            <CardDescription>
              {language === 'ar'
                ? 'يجب أن يكون لديك إما خطة عمل أو إثبات استثمار'
                : 'You must have either a business plan OR proof of investment'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{language === 'ar' ? 'لدي خطة عمل قابلة للتطبيق' : 'I have a viable business plan'}</Label>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar'
                    ? 'خطة توضح نشاطك المقترح في البرتغال'
                    : 'A plan detailing your proposed activity in Portugal'}
                </p>
              </div>
              <Switch
                checked={formData.hasBusinessPlan}
                onCheckedChange={(v) => setFormData({ ...formData, hasBusinessPlan: v })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{language === 'ar' ? 'لدي استثمار في البرتغال' : 'I have investment in Portugal'}</Label>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar'
                    ? 'استثمار منفذ أو أموال متاحة في البرتغال'
                    : 'Executed investment or funds available in Portugal'}
                </p>
              </div>
              <Switch
                checked={formData.hasInvestment}
                onCheckedChange={(v) => setFormData({ ...formData, hasInvestment: v })}
              />
            </div>

            {formData.hasInvestment && (
              <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                <Label>{language === 'ar' ? 'مبلغ الاستثمار (يورو)' : 'Investment Amount (EUR)'}</Label>
                <Input
                  type="number"
                  placeholder="e.g. 50000"
                  value={formData.investmentAmount || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      investmentAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                />
              </div>
            )}

            {formData.employmentType === 'liberal_profession' && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Label>{language === 'ar' ? 'لدي عقد/عرض خدمات' : 'I have a service contract/proposal'}</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              {language === 'ar'
                                ? 'مطلوب للمهن الحرة مثل الأطباء والمحامين والمهندسين'
                                : 'Required for liberal professions like doctors, lawyers, engineers'}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'عقد أو عرض لتقديم خدماتك المهنية' : 'Contract or proposal for your professional services'}
                    </p>
                  </div>
                  <Switch
                    checked={formData.hasServiceContract}
                    onCheckedChange={(v) => setFormData({ ...formData, hasServiceContract: v })}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Documentation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {language === 'ar' ? 'الوثائق والمتطلبات' : 'Documentation & Requirements'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>{language === 'ar' ? 'لدي شهادة مؤهلات مهنية' : 'I have professional qualification certificate'}</Label>
              <Switch
                checked={formData.hasProfessionalQualification}
                onCheckedChange={(v) => setFormData({ ...formData, hasProfessionalQualification: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>{language === 'ar' ? 'لدي إثبات الموارد المالية في البرتغال' : 'I have proof of financial means in Portugal'}</Label>
              <Switch
                checked={formData.hasFinancialMeansInPortugal}
                onCheckedChange={(v) => setFormData({ ...formData, hasFinancialMeansInPortugal: v })}
              />
            </div>

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
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'قد يؤثر على طلبك' : 'This may affect your application'}
                </p>
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
