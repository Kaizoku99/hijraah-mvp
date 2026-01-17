'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/LanguageContext'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { VisaMatcher } from '@/components/portugal/VisaMatcher'
import { D2EligibilityChecker } from '@/components/portugal/D2EligibilityChecker'
import { D7EligibilityChecker } from '@/components/portugal/D7EligibilityChecker'
import { D8EligibilityChecker } from '@/components/portugal/D8EligibilityChecker'
import { savePortugalAssessment } from '@/actions/portugal'
import { EligibilityResult } from '@/lib/portugal-visa-matcher'

import {
  Sparkles,
  Briefcase,
  Wallet,
  Laptop,
  Flag,
  ExternalLink,
  Info,
} from 'lucide-react'
import { PORTUGAL_VISAS, PORTUGAL_CONTACT_INFO, PORTUGAL_POLICY_FLAGS } from '@/lib/portugal-constants'

type TabValue = 'matcher' | 'd2' | 'd7' | 'd8'

export function PortugalCalculator() {
  const { language } = useLanguage()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabValue>('matcher')

  const saveMutation = useMutation({
    mutationFn: savePortugalAssessment,
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم حفظ التقييم بنجاح' : 'Assessment saved successfully')
      queryClient.invalidateQueries({ queryKey: ['portugalAssessments'] })
    },
    onError: (error) => {
      toast.error(language === 'ar' ? 'فشل حفظ التقييم' : 'Failed to save assessment')
      console.error('Save error:', error)
    },
  })

  const handleSaveD2 = async (result: EligibilityResult, input: Parameters<typeof savePortugalAssessment>[0]['input']) => {
    await saveMutation.mutateAsync({
      visaType: 'd2',
      input,
      result,
    })
  }

  const handleSaveD7 = async (result: EligibilityResult, input: Parameters<typeof savePortugalAssessment>[0]['input']) => {
    await saveMutation.mutateAsync({
      visaType: 'd7',
      input,
      result,
    })
  }

  const handleSaveD8 = async (result: EligibilityResult, input: Parameters<typeof savePortugalAssessment>[0]['input']) => {
    await saveMutation.mutateAsync({
      visaType: 'd8',
      input,
      result,
    })
  }

  const handleSelectVisa = (visaType: string) => {
    if (['d2', 'd7', 'd8'].includes(visaType)) {
      setActiveTab(visaType as TabValue)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-red-500 flex items-center justify-center">
            <Flag className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold">
            {language === 'ar' ? 'تأشيرات البرتغال' : 'Portugal Visas'}
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {language === 'ar'
            ? 'اكتشف أفضل مسار تأشيرة لك وتحقق من أهليتك'
            : 'Discover the best visa pathway for you and check your eligibility'}
        </p>
      </div>

      {/* Policy Alerts */}
      <div className="grid md:grid-cols-3 gap-4">
        {PORTUGAL_POLICY_FLAGS.map((flag, idx) => (
          <Card 
            key={idx} 
            className={`border-l-4 ${
              flag.type === 'success' ? 'border-l-green-500' : 
              flag.type === 'warning' ? 'border-l-amber-500' : 
              'border-l-blue-500'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <Info className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                  flag.type === 'success' ? 'text-green-500' : 
                  flag.type === 'warning' ? 'text-amber-500' : 
                  'text-blue-500'
                }`} />
                <div>
                  <p className="font-medium text-sm">
                    {language === 'ar' ? flag.title.ar : flag.title.en}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'ar' ? flag.description.ar : flag.description.en}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="matcher" className="flex flex-col gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Sparkles className="h-5 w-5" />
            <span className="text-xs font-medium">
              {language === 'ar' ? 'المطابقة الذكية' : 'Smart Matcher'}
            </span>
          </TabsTrigger>
          <TabsTrigger value="d2" className="flex flex-col gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Briefcase className="h-5 w-5" />
            <span className="text-xs font-medium">
              D2
            </span>
          </TabsTrigger>
          <TabsTrigger value="d7" className="flex flex-col gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Wallet className="h-5 w-5" />
            <span className="text-xs font-medium">
              D7
            </span>
          </TabsTrigger>
          <TabsTrigger value="d8" className="flex flex-col gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Laptop className="h-5 w-5" />
            <span className="text-xs font-medium">
              D8
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Visa Type Descriptions */}
        <div className="flex flex-wrap gap-2 justify-center">
          {activeTab === 'd2' && (
            <Badge variant="outline" className="text-sm">
              {language === 'ar' ? PORTUGAL_VISAS.d2.description.ar : PORTUGAL_VISAS.d2.description.en}
            </Badge>
          )}
          {activeTab === 'd7' && (
            <Badge variant="outline" className="text-sm">
              {language === 'ar' ? PORTUGAL_VISAS.d7.description.ar : PORTUGAL_VISAS.d7.description.en}
            </Badge>
          )}
          {activeTab === 'd8' && (
            <Badge variant="outline" className="text-sm">
              {language === 'ar' ? PORTUGAL_VISAS.d8.description.ar : PORTUGAL_VISAS.d8.description.en}
            </Badge>
          )}
        </div>

        <TabsContent value="matcher" className="mt-6">
          <VisaMatcher onSelectVisa={handleSelectVisa} />
        </TabsContent>

        <TabsContent value="d2" className="mt-6">
          <D2EligibilityChecker 
            onSave={handleSaveD2} 
            isSaving={saveMutation.isPending} 
          />
        </TabsContent>

        <TabsContent value="d7" className="mt-6">
          <D7EligibilityChecker 
            onSave={handleSaveD7} 
            isSaving={saveMutation.isPending} 
          />
        </TabsContent>

        <TabsContent value="d8" className="mt-6">
          <D8EligibilityChecker 
            onSave={handleSaveD8} 
            isSaving={saveMutation.isPending} 
          />
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      <Card className="bg-muted/50">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="font-semibold">
                {language === 'ar' 
                  ? PORTUGAL_CONTACT_INFO.authority.name.ar 
                  : PORTUGAL_CONTACT_INFO.authority.name.en}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' 
                  ? 'المصدر الرسمي لمعلومات التأشيرات' 
                  : 'Official source for visa information'}
              </p>
            </div>
            <a
              href={PORTUGAL_CONTACT_INFO.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              {PORTUGAL_CONTACT_INFO.website.replace('https://', '')}
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            {language === 'ar'
              ? 'تنويه: هذه الأداة للإرشاد فقط. يرجى التحقق من المتطلبات الرسمية من موقع وزارة الخارجية البرتغالية.'
              : 'Disclaimer: This tool is for guidance only. Please verify official requirements from the Portuguese MFA website.'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
