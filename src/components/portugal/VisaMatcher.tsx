'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/LanguageContext'
import { CountrySelect } from '@/components/CountrySelect'
import {
  matchVisas,
  VisaMatcherInput,
  VisaRecommendation,
} from '@/lib/portugal-visa-matcher'
import {
  PORTUGAL_VISAS,
  D8_MINIMUM_INCOME_EUR,
  PORTUGAL_MINIMUM_WAGE_EUR,
} from '@/lib/portugal-constants'
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  Laptop,
  Wallet,
  Building2,
  Search,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface VisaMatcherProps {
  onSelectVisa?: (visaType: string) => void
}

type Step = 'job_offer' | 'remote_work' | 'employer_location' | 'passive_income' | 'business_plans' | 'income' | 'results'

export function VisaMatcher({ onSelectVisa }: VisaMatcherProps) {
  const { language } = useLanguage()
  
  const [currentStep, setCurrentStep] = useState<Step>('job_offer')
  const [answers, setAnswers] = useState({
    hasPortugueseJobOffer: false,
    isRemoteWorker: false,
    employerCountry: '',
    hasPassiveIncome: false,
    planningBusiness: false,
    monthlyIncome: 0,
  })
  const [results, setResults] = useState<VisaRecommendation[]>([])

  const steps: Step[] = ['job_offer', 'remote_work', 'employer_location', 'passive_income', 'business_plans', 'income', 'results']
  const currentStepIndex = steps.indexOf(currentStep)
  const progress = ((currentStepIndex) / (steps.length - 1)) * 100

  const getNextStep = (current: Step): Step => {
    switch (current) {
      case 'job_offer':
        if (answers.hasPortugueseJobOffer) return 'income' // Skip to income, D1 is clear
        return 'remote_work'
      case 'remote_work':
        if (answers.isRemoteWorker) return 'employer_location'
        return 'passive_income'
      case 'employer_location':
        return 'income'
      case 'passive_income':
        if (answers.hasPassiveIncome) return 'income'
        return 'business_plans'
      case 'business_plans':
        return 'income'
      case 'income':
        return 'results'
      default:
        return 'results'
    }
  }

  const getPreviousStep = (current: Step): Step => {
    const idx = steps.indexOf(current)
    if (idx <= 0) return current
    
    // Go back intelligently
    if (current === 'results') return 'income'
    if (current === 'income') {
      if (answers.planningBusiness) return 'business_plans'
      if (answers.hasPassiveIncome) return 'passive_income'
      if (answers.isRemoteWorker) return 'employer_location'
      if (answers.hasPortugueseJobOffer) return 'job_offer'
      return 'business_plans'
    }
    if (current === 'business_plans') return 'passive_income'
    if (current === 'passive_income') return 'remote_work'
    if (current === 'employer_location') return 'remote_work'
    if (current === 'remote_work') return 'job_offer'
    return 'job_offer'
  }

  const handleNext = () => {
    if (currentStep === 'income') {
      // Calculate results
      const input: VisaMatcherInput = {
        hasPortugueseJobOffer: answers.hasPortugueseJobOffer,
        isRemoteWorker: answers.isRemoteWorker,
        hasPassiveIncome: answers.hasPassiveIncome,
        planningBusiness: answers.planningBusiness,
        monthlyIncome: answers.monthlyIncome,
        employerCountry: answers.employerCountry,
      }
      const recommendations = matchVisas(input)
      setResults(recommendations)
    }
    setCurrentStep(getNextStep(currentStep))
  }

  const handleBack = () => {
    setCurrentStep(getPreviousStep(currentStep))
  }

  const handleReset = () => {
    setAnswers({
      hasPortugueseJobOffer: false,
      isRemoteWorker: false,
      employerCountry: '',
      hasPassiveIncome: false,
      planningBusiness: false,
      monthlyIncome: 0,
    })
    setResults([])
    setCurrentStep('job_offer')
  }

  const getVisaIcon = (visaType: string) => {
    switch (visaType) {
      case 'd1': return Briefcase
      case 'd2': return Building2
      case 'd7': return Wallet
      case 'd8': return Laptop
      default: return Search
    }
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'job_offer':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Briefcase className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">
                {language === 'ar' ? 'هل لديك عرض عمل من صاحب عمل برتغالي؟' : 'Do you have a job offer from a Portuguese employer?'}
              </h3>
              <p className="text-muted-foreground mt-2">
                {language === 'ar' ? 'عقد عمل أو وعد بالعمل من شركة في البرتغال' : 'An employment contract or job promise from a company in Portugal'}
              </p>
            </div>
            <RadioGroup
              value={answers.hasPortugueseJobOffer ? 'yes' : 'no'}
              onValueChange={(v) => setAnswers({ ...answers, hasPortugueseJobOffer: v === 'yes' })}
              className="flex flex-col gap-3"
            >
              <Label
                htmlFor="job-yes"
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                  answers.hasPortugueseJobOffer ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                )}
              >
                <RadioGroupItem value="yes" id="job-yes" />
                <span className="font-medium">{language === 'ar' ? 'نعم، لدي عرض عمل' : 'Yes, I have a job offer'}</span>
              </Label>
              <Label
                htmlFor="job-no"
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                  !answers.hasPortugueseJobOffer ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                )}
              >
                <RadioGroupItem value="no" id="job-no" />
                <span className="font-medium">{language === 'ar' ? 'لا، ليس لدي' : 'No, I don\'t'}</span>
              </Label>
            </RadioGroup>
          </div>
        )

      case 'remote_work':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="h-16 w-16 mx-auto rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                <Laptop className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold">
                {language === 'ar' ? 'هل تعمل عن بُعد؟' : 'Do you work remotely?'}
              </h3>
              <p className="text-muted-foreground mt-2">
                {language === 'ar' ? 'موظف عن بُعد أو عامل حر دولي' : 'Remote employee or international freelancer'}
              </p>
            </div>
            <RadioGroup
              value={answers.isRemoteWorker ? 'yes' : 'no'}
              onValueChange={(v) => setAnswers({ ...answers, isRemoteWorker: v === 'yes' })}
              className="flex flex-col gap-3"
            >
              <Label
                htmlFor="remote-yes"
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                  answers.isRemoteWorker ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                )}
              >
                <RadioGroupItem value="yes" id="remote-yes" />
                <span className="font-medium">{language === 'ar' ? 'نعم، أعمل عن بُعد' : 'Yes, I work remotely'}</span>
              </Label>
              <Label
                htmlFor="remote-no"
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                  !answers.isRemoteWorker ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                )}
              >
                <RadioGroupItem value="no" id="remote-no" />
                <span className="font-medium">{language === 'ar' ? 'لا، لا أعمل عن بُعد' : 'No, I don\'t work remotely'}</span>
              </Label>
            </RadioGroup>
          </div>
        )

      case 'employer_location':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="h-16 w-16 mx-auto rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold">
                {language === 'ar' ? 'أين يقع صاحب عملك؟' : 'Where is your employer located?'}
              </h3>
              <p className="text-muted-foreground mt-2">
                {language === 'ar' ? 'تأشيرة D8 تتطلب صاحب عمل خارج البرتغال' : 'D8 visa requires employer outside Portugal'}
              </p>
            </div>
            <CountrySelect
              value={answers.employerCountry}
              onValueChange={(v) => setAnswers({ ...answers, employerCountry: v })}
              placeholder={language === 'ar' ? 'اختر بلد صاحب العمل' : 'Select employer country'}
              language={language}
            />
            {answers.employerCountry && (
              <div className="text-center mt-4">
                {answers.employerCountry.toLowerCase() !== 'portugal' && answers.employerCountry.toLowerCase() !== 'pt' ? (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {language === 'ar' ? 'مؤهل لتأشيرة D8' : 'Eligible for D8 visa'}
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {language === 'ar' ? 'D8 تتطلب صاحب عمل خارج البرتغال' : 'D8 needs non-PT employer'}
                  </Badge>
                )}
              </div>
            )}
          </div>
        )

      case 'passive_income':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="h-16 w-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <Wallet className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold">
                {language === 'ar' ? 'هل لديك دخل سلبي؟' : 'Do you have passive income?'}
              </h3>
              <p className="text-muted-foreground mt-2">
                {language === 'ar' ? 'معاش، إيجارات، استثمارات، أرباح أسهم' : 'Pension, rental income, investments, dividends'}
              </p>
            </div>
            <RadioGroup
              value={answers.hasPassiveIncome ? 'yes' : 'no'}
              onValueChange={(v) => setAnswers({ ...answers, hasPassiveIncome: v === 'yes' })}
              className="flex flex-col gap-3"
            >
              <Label
                htmlFor="passive-yes"
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                  answers.hasPassiveIncome ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                )}
              >
                <RadioGroupItem value="yes" id="passive-yes" />
                <span className="font-medium">{language === 'ar' ? 'نعم، لدي دخل سلبي' : 'Yes, I have passive income'}</span>
              </Label>
              <Label
                htmlFor="passive-no"
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                  !answers.hasPassiveIncome ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                )}
              >
                <RadioGroupItem value="no" id="passive-no" />
                <span className="font-medium">{language === 'ar' ? 'لا، ليس لدي' : 'No, I don\'t'}</span>
              </Label>
            </RadioGroup>
          </div>
        )

      case 'business_plans':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="h-16 w-16 mx-auto rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold">
                {language === 'ar' ? 'هل تخطط لبدء عمل تجاري في البرتغال؟' : 'Are you planning to start a business in Portugal?'}
              </h3>
              <p className="text-muted-foreground mt-2">
                {language === 'ar' ? 'عمل مستقل، شركة، أو استثمار' : 'Freelance, company, or investment'}
              </p>
            </div>
            <RadioGroup
              value={answers.planningBusiness ? 'yes' : 'no'}
              onValueChange={(v) => setAnswers({ ...answers, planningBusiness: v === 'yes' })}
              className="flex flex-col gap-3"
            >
              <Label
                htmlFor="business-yes"
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                  answers.planningBusiness ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                )}
              >
                <RadioGroupItem value="yes" id="business-yes" />
                <span className="font-medium">{language === 'ar' ? 'نعم، أخطط لذلك' : 'Yes, I\'m planning to'}</span>
              </Label>
              <Label
                htmlFor="business-no"
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                  !answers.planningBusiness ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                )}
              >
                <RadioGroupItem value="no" id="business-no" />
                <span className="font-medium">{language === 'ar' ? 'لا، ليس لدي خطط' : 'No, I don\'t have plans'}</span>
              </Label>
            </RadioGroup>
          </div>
        )

      case 'income':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Wallet className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">
                {language === 'ar' ? 'ما هو دخلك الشهري؟' : 'What is your monthly income?'}
              </h3>
              <p className="text-muted-foreground mt-2">
                {language === 'ar' ? 'الدخل الشهري بالعملة الأوروبية (يورو)' : 'Monthly income in EUR'}
              </p>
            </div>
            <div className="space-y-4">
              <Input
                type="number"
                placeholder={language === 'ar' ? 'أدخل دخلك الشهري' : 'Enter monthly income'}
                value={answers.monthlyIncome || ''}
                onChange={(e) => setAnswers({ ...answers, monthlyIncome: parseFloat(e.target.value) || 0 })}
                className="text-center text-xl h-14"
              />
              
              {/* Income thresholds info */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className={cn(
                  "p-4 rounded-lg border-2 text-center transition-colors",
                  answers.monthlyIncome >= PORTUGAL_MINIMUM_WAGE_EUR 
                    ? "border-green-500 bg-green-50 dark:bg-green-950/30" 
                    : "border-gray-200 dark:border-gray-700"
                )}>
                  <p className="text-xs text-muted-foreground mb-1">D7 {language === 'ar' ? 'الحد الأدنى' : 'Minimum'}</p>
                  <p className="text-lg font-bold">€{PORTUGAL_MINIMUM_WAGE_EUR}</p>
                  {answers.monthlyIncome >= PORTUGAL_MINIMUM_WAGE_EUR && (
                    <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto mt-1" />
                  )}
                </div>
                <div className={cn(
                  "p-4 rounded-lg border-2 text-center transition-colors",
                  answers.monthlyIncome >= D8_MINIMUM_INCOME_EUR 
                    ? "border-green-500 bg-green-50 dark:bg-green-950/30" 
                    : "border-gray-200 dark:border-gray-700"
                )}>
                  <p className="text-xs text-muted-foreground mb-1">D8 {language === 'ar' ? 'الحد الأدنى' : 'Minimum'}</p>
                  <p className="text-lg font-bold">€{D8_MINIMUM_INCOME_EUR.toLocaleString()}</p>
                  {answers.monthlyIncome >= D8_MINIMUM_INCOME_EUR && (
                    <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto mt-1" />
                  )}
                </div>
              </div>
            </div>
          </div>
        )

      case 'results':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="h-16 w-16 mx-auto rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold">
                {language === 'ar' ? 'التأشيرات الموصى بها لك' : 'Recommended Visas for You'}
              </h3>
              <p className="text-muted-foreground mt-2">
                {language === 'ar' ? 'بناءً على إجاباتك' : 'Based on your answers'}
              </p>
            </div>

            {results.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {language === 'ar' 
                    ? 'لم نتمكن من تحديد تأشيرة مناسبة. جرب تأشيرة البحث عن عمل.'
                    : 'We couldn\'t determine a suitable visa. Consider the Job Seeker visa.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((rec, idx) => {
                  const Icon = getVisaIcon(rec.visaType)
                  const visaInfo = PORTUGAL_VISAS[rec.visaType]
                  
                  return (
                    <Card 
                      key={rec.visaType}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        idx === 0 && "border-2 border-primary ring-2 ring-primary/20"
                      )}
                      onClick={() => onSelectVisa?.(rec.visaType)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0",
                            idx === 0 ? "bg-primary text-white" : "bg-primary/10 text-primary"
                          )}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold">
                                {language === 'ar' ? visaInfo.name.ar : visaInfo.name.en}
                              </h4>
                              {idx === 0 && (
                                <Badge className="bg-primary text-white">
                                  {language === 'ar' ? 'الأفضل لك' : 'Best Match'}
                                </Badge>
                              )}
                              <Badge className={getConfidenceColor(rec.confidence)}>
                                {rec.score}% {language === 'ar' ? 'تطابق' : 'match'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {language === 'ar' ? visaInfo.description.ar : visaInfo.description.en}
                            </p>
                            <div className="mt-3 space-y-1">
                              {rec.reasons.map((reason, rIdx) => (
                                <p key={rIdx} className="text-xs text-muted-foreground flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                                  {language === 'ar' ? reason.ar : reason.en}
                                </p>
                              ))}
                              {rec.warnings?.map((warning, wIdx) => (
                                <p key={wIdx} className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                                  {language === 'ar' ? warning.ar : warning.en}
                                </p>
                              ))}
                            </div>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                {language === 'ar' ? 'إعادة المطابقة' : 'Start Over'}
              </Button>
            </div>
          </div>
        )
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {language === 'ar' ? 'مطابق التأشيرة الذكي' : 'Smart Visa Matcher'}
            </CardTitle>
            <CardDescription>
              {language === 'ar' 
                ? 'أجب على بعض الأسئلة لنجد أفضل تأشيرة لك'
                : 'Answer a few questions to find the best visa for you'}
            </CardDescription>
          </div>
          {currentStep !== 'results' && (
            <Badge variant="outline">
              {currentStepIndex + 1}/{steps.length - 1}
            </Badge>
          )}
        </div>
        {currentStep !== 'results' && (
          <Progress value={progress} className="mt-4" />
        )}
      </CardHeader>
      <CardContent>
        {renderStep()}

        {/* Navigation */}
        {currentStep !== 'results' && (
          <div className="flex items-center justify-between mt-8 pt-4 border-t">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 'job_offer'}
              className="gap-2"
            >
              <ArrowLeft className={cn("h-4 w-4", language === "ar" && "rotate-180")} />
              {language === 'ar' ? 'السابق' : 'Back'}
            </Button>
            <Button
              onClick={handleNext}
              disabled={currentStep === 'employer_location' && !answers.employerCountry}
              className="gap-2"
            >
              {currentStep === 'income' 
                ? (language === 'ar' ? 'عرض النتائج' : 'See Results')
                : (language === 'ar' ? 'التالي' : 'Next')}
              <ArrowRight className={cn("h-4 w-4", language === "ar" && "rotate-180")} />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
