"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useLanguage } from "@/contexts/LanguageContext"
import { useMutation, useQuery } from "@tanstack/react-query"
import { getProfile } from "@/actions/profile"
import { calculateAustraliaPoints, getLatestAustraliaPoints } from "@/actions/points-test"
import { calculateAustraliaPoints as calculateClient, AustraliaPointsData, AustraliaPointsResult } from "@/lib/australia-calculator"
import { useDebounce } from "@/hooks/useDebounce"
import {
    Award,
    Loader2,
    Save,
    HelpCircle
} from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

type AustralianEnglishLevel = 'competent' | 'proficient' | 'superior';
type TestType = 'ielts' | 'pte' | 'toefl';

export function AustraliaCalculator() {
    const { t, language } = useLanguage()
    const [isPreFilled, setIsPreFilled] = useState(false)

    // Language Test State
    const [testType, setTestType] = useState<TestType>('ielts')
    const [rawScores, setRawScores] = useState({
        listening: '',
        reading: '',
        writing: '',
        speaking: ''
    })

    // Form State
    const [formData, setFormData] = useState<AustraliaPointsData>({
        age: 25,
        englishLevel: 'competent',
        overseasExperience: 'less_than_3',
        australianExperience: 'less_than_1',
        educationLevel: 'bachelor',
        specialistEducation: false,
        australianStudy: false,
        professionalYear: false,
        credentialledCommunityLanguage: false,
        regionalStudy: false,
        partnerSkills: 'single', // Default to single (= 10 points) is safer for mental model
        nomination: 'none',
    })

    const { data: profile } = useQuery({
        queryKey: ['profile', 'get'],
        queryFn: getProfile,
    })

    const { data: savedAssessment, isLoading: isLoadingAssessment } = useQuery({
        queryKey: ['australia-points', 'latest'],
        queryFn: getLatestAustraliaPoints,
    })

    const [result, setResult] = useState<AustraliaPointsResult | null>(null)
    const debouncedFormData = useDebounce(formData, 500)

    // Helper: Determine English Level based on scores
    const calculateEnglishLevel = (type: TestType, scores: typeof rawScores): AustralianEnglishLevel => {
        const l = parseFloat(scores.listening) || 0
        const r = parseFloat(scores.reading) || 0
        const w = parseFloat(scores.writing) || 0
        const s = parseFloat(scores.speaking) || 0

        if (type === 'ielts') {
            if (l >= 8 && r >= 8 && w >= 8 && s >= 8) return 'superior' // 20 pts
            if (l >= 7 && r >= 7 && w >= 7 && s >= 7) return 'proficient' // 10 pts
            if (l >= 6 && r >= 6 && w >= 6 && s >= 6) return 'competent' // 0 pts
        } else if (type === 'pte') {
            if (l >= 79 && r >= 79 && w >= 79 && s >= 79) return 'superior'
            if (l >= 65 && r >= 65 && w >= 65 && s >= 65) return 'proficient'
            if (l >= 50 && r >= 50 && w >= 50 && s >= 50) return 'competent'
        } else if (type === 'toefl') {
            // TOEFL iBT: Superior (L:28 R:29 W:30 S:26), Proficient (L:24 R:24 W:27 S:23), Competent (L:12 R:13 W:21 S:18)
            if (l >= 28 && r >= 29 && w >= 30 && s >= 26) return 'superior'
            if (l >= 24 && r >= 24 && w >= 27 && s >= 23) return 'proficient'
            if (l >= 12 && r >= 13 && w >= 21 && s >= 18) return 'competent'
        }

        return 'competent'
    }

    // Effect: Update English Level when scores change
    useEffect(() => {
        const level = calculateEnglishLevel(testType, rawScores)
        setFormData(prev => ({ ...prev, englishLevel: level }))
    }, [rawScores, testType])

    // Auto-populate from Profile OR Saved Assessment
    useEffect(() => {
        if (isLoadingAssessment) return

        if (!isPreFilled) {
            let newData = { ...formData }
            let dataFound = false

            // 1. Try to restore from saved assessment (more specific)
            if (savedAssessment) {
                // Restore booleans from scores (0 = false, >0 = true)
                newData.specialistEducation = savedAssessment.specialistEducationScore > 0
                newData.australianStudy = savedAssessment.australianStudyScore > 0
                newData.professionalYear = savedAssessment.professionalYearScore > 0
                newData.credentialledCommunityLanguage = savedAssessment.communityLanguageScore > 0
                newData.regionalStudy = savedAssessment.regionalStudyScore > 0

                // Restore Enums from Scores (Approximation)
                // Age - can't reverse score to age, so keep default or profile

                // English
                if (savedAssessment.englishScore === 20) newData.englishLevel = 'superior'
                else if (savedAssessment.englishScore === 10) newData.englishLevel = 'proficient'
                else newData.englishLevel = 'competent'

                // Overseas Experience
                if (savedAssessment.overseasExperienceScore === 15) newData.overseasExperience = '8_plus'
                else if (savedAssessment.overseasExperienceScore === 10) newData.overseasExperience = '5_to_8'
                else if (savedAssessment.overseasExperienceScore === 5) newData.overseasExperience = '3_to_5'
                else newData.overseasExperience = 'less_than_3'

                // Australian Experience
                if (savedAssessment.australianExperienceScore === 20) newData.australianExperience = '8_plus'
                else if (savedAssessment.australianExperienceScore === 15) newData.australianExperience = '5_to_8'
                else if (savedAssessment.australianExperienceScore === 10) newData.australianExperience = '3_to_5'
                else if (savedAssessment.australianExperienceScore === 5) newData.australianExperience = '1_to_3'
                else newData.australianExperience = 'less_than_1'

                // Education - ambiguous, mapped best effort
                if (savedAssessment.educationScore === 20) newData.educationLevel = 'phd'
                else if (savedAssessment.educationScore === 15) newData.educationLevel = 'bachelor' // could be master
                else if (savedAssessment.educationScore === 10) newData.educationLevel = 'diploma' // could be trade
                else newData.educationLevel = 'other'

                // Partner - ambiguous
                if (savedAssessment.partnerScore === 10) newData.partnerSkills = 'single' // or skilled/pr
                else if (savedAssessment.partnerScore === 5) newData.partnerSkills = 'partner_english'
                else newData.partnerSkills = 'partner_no_points'

                // Nomination
                if (savedAssessment.nominationScore === 15) newData.nomination = 'regional_491'
                else if (savedAssessment.nominationScore === 5) newData.nomination = 'state_190'
                else newData.nomination = 'none'

                dataFound = true
            }

            // 2. Overlay User Profile Data (if available and no conflict, or to refine ambiguities)
            if (profile) {
                const age = profile.dateOfBirth
                    ? new Date().getFullYear() - new Date(profile.dateOfBirth).getFullYear()
                    : 25
                newData.age = age

                // If we didn't have saved assessment, map others from profile
                if (!savedAssessment) {
                    if (profile.educationLevel === 'phd') newData.educationLevel = 'phd'
                    else if (profile.educationLevel === 'master') newData.educationLevel = 'master'
                    else if (profile.educationLevel === 'bachelor') newData.educationLevel = 'bachelor'
                    else if (profile.educationLevel === 'high_school') newData.educationLevel = 'other'
                    else if (profile.educationLevel === 'other') newData.educationLevel = 'other'

                    if (profile.yearsOfExperience) {
                        const y = profile.yearsOfExperience
                        if (y >= 8) newData.overseasExperience = '8_plus'
                        else if (y >= 5) newData.overseasExperience = '5_to_8'
                        else if (y >= 3) newData.overseasExperience = '3_to_5'
                        else newData.overseasExperience = 'less_than_3'
                    }

                    // Map english raw scores if available
                    if (profile.ieltsScore) {
                        setRawScores({
                            listening: profile.ieltsScore,
                            reading: profile.ieltsScore,
                            writing: profile.ieltsScore,
                            speaking: profile.ieltsScore
                        })
                        setTestType('ielts')
                    }
                } else {
                    // Refine ambiguous mappings using Profile if scores match
                    // e.g. if saved score is 15 (Bachelor/Master) and Profile says Master, choose Master
                    if (savedAssessment.educationScore === 15) {
                        if (profile.educationLevel === 'master') newData.educationLevel = 'master'
                        else if (profile.educationLevel === 'bachelor') newData.educationLevel = 'bachelor'
                    }
                }
                dataFound = true
            }

            if (dataFound) {
                setFormData(newData)
                setIsPreFilled(true)
            }
        }
    }, [profile, savedAssessment, isLoadingAssessment, isPreFilled, language])

    // Real-time Calc
    useEffect(() => {
        setResult(calculateClient(debouncedFormData))
    }, [debouncedFormData])

    // Save Mutation
    const saveMutation = useMutation({
        mutationFn: calculateAustraliaPoints,
        onSuccess: (data) => {
            setResult(data)
            toast.success(language === "ar" ? "تم حفظ التقييم بنجاح" : "Assessment saved successfully")
        },
        onError: (error: any) => {
            toast.error(error.message)
        }
    })

    const handleSave = () => {
        saveMutation.mutate({
            ...formData,
            saveAssessment: true
        })
    }

    return (
        <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>{language === "ar" ? "حاسبة النقاط الأسترالية" : "Australia Points Calculator"}</CardTitle>
                        <CardDescription>
                            {language === "ar"
                                ? "أدخل معلوماتك للتحقق من أهليتك لبرامج SkillSelect (الفئة 189، 190، 491)"
                                : "Check your eligibility for SkillSelect visas (Subclass 189, 190, 491)"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Age */}
                        <div className="space-y-2">
                            <Label htmlFor="age">{language === "ar" ? "العمر" : "Age"}</Label>
                            <Input
                                id="age"
                                type="number"
                                min="18"
                                max="50"
                                value={formData.age}
                                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                            />
                        </div>

                        {/* English */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>{language === "ar" ? "اختبار اللغة" : "Language Test Score"}</Label>
                                <Select value={testType} onValueChange={(v: TestType) => setTestType(v)}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ielts">IELTS</SelectItem>
                                        <SelectItem value="pte">PTE Academic</SelectItem>
                                        <SelectItem value="toefl">TOEFL iBT</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {['listening', 'reading', 'writing', 'speaking'].map((skill) => (
                                    <div key={skill} className="space-y-2">
                                        <Label className="capitalize text-xs text-muted-foreground">{skill}</Label>
                                        <Input
                                            placeholder="Score"
                                            value={
                                                // @ts-ignore
                                                rawScores[skill]
                                            }
                                            onChange={(e) => setRawScores({ ...rawScores, [skill]: e.target.value })}
                                        />
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground text-right font-medium">
                                Calculated Level: <span className="text-primary capitalize">{formData.englishLevel}</span>
                                {formData.englishLevel === 'superior' ? ' (+20 pts)' : formData.englishLevel === 'proficient' ? ' (+10 pts)' : ' (0 pts)'}
                            </p>
                        </div>

                        <Separator />

                        {/* Experience */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex items-start gap-2">
                                    <Label>{language === "ar" ? "خبرة خارج أستراليا" : "Overseas Experience"}</Label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                                            <TooltipContent>
                                                <p>Experience in your nominated occupation in the last 10 years.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <Select
                                    value={formData.overseasExperience}
                                    onValueChange={(v: any) => setFormData({ ...formData, overseasExperience: v })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="less_than_3">&lt; 3 Years (0 pts)</SelectItem>
                                        <SelectItem value="3_to_5">3-5 Years (5 pts)</SelectItem>
                                        <SelectItem value="5_to_8">5-8 Years (10 pts)</SelectItem>
                                        <SelectItem value="8_plus">8+ Years (15 pts)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-start gap-2">
                                    <Label>{language === "ar" ? "خبرة في أستراليا" : "Australian Experience"}</Label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                                            <TooltipContent>
                                                <p>Experience in Australia in your nominated occupation.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <Select
                                    value={formData.australianExperience}
                                    onValueChange={(v: any) => setFormData({ ...formData, australianExperience: v })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="less_than_1">&lt; 1 Year (0 pts)</SelectItem>
                                        <SelectItem value="1_to_3">1-3 Years (5 pts)</SelectItem>
                                        <SelectItem value="3_to_5">3-5 Years (10 pts)</SelectItem>
                                        <SelectItem value="5_to_8">5-8 Years (15 pts)</SelectItem>
                                        <SelectItem value="8_plus">8+ Years (20 pts)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Education */}
                        <div className="space-y-2">
                            <Label>{language === "ar" ? "المؤهل العلمي" : "Education Qualification"}</Label>
                            <Select
                                value={formData.educationLevel}
                                onValueChange={(v: any) => setFormData({ ...formData, educationLevel: v })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="other">Other / High School (0 pts)</SelectItem>
                                    <SelectItem value="diploma">Diploma / Trade Qualification (10 pts)</SelectItem>
                                    <SelectItem value="recognized_qualification">Recognized Qualification (10 pts)</SelectItem>
                                    <SelectItem value="bachelor">Bachelor&apos;s Degree (15 pts)</SelectItem>
                                    <SelectItem value="master">Master&apos;s Degree (15 pts)</SelectItem>
                                    <SelectItem value="phd">Doctorate (PhD) (20 pts)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Toggles */}
                        <div className="space-y-4">
                            <Label className="text-base font-semibold">{language === "ar" ? "نقاط إضافية" : "Additional Points"}</Label>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <Label>Specialist Education</Label>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                                                <TooltipContent className="max-w-xs">
                                                    <p>Master&apos;s by research or PhD details in STEM fields (Science, Tech, Engineering, Math) or ICT from an Australian institution (2 academic years).</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <p className="text-sm text-muted-foreground">Australian STEM Master&apos;s (Research) or PhD</p>
                                </div>
                                <Switch checked={formData.specialistEducation} onCheckedChange={(v) => setFormData({ ...formData, specialistEducation: v })} />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Australian Study Requirement</Label>
                                    <p className="text-sm text-muted-foreground">Study in Australia for at least 2 years</p>
                                </div>
                                <Switch checked={formData.australianStudy} onCheckedChange={(v) => setFormData({ ...formData, australianStudy: v })} />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <Label>Professional Year</Label>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                                                <TooltipContent className="max-w-xs">
                                                    <p>Completed an approved Professional Year program in Australia in Accounting, IT, or Engineering (12 months).</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <p className="text-sm text-muted-foreground">Approved PY Program (IT/Eng/Accounting)</p>
                                </div>
                                <Switch checked={formData.professionalYear} onCheckedChange={(v) => setFormData({ ...formData, professionalYear: v })} />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Credentialled Community Language</Label>
                                    <p className="text-sm text-muted-foreground">NAATI Accreditation (CCL Test)</p>
                                </div>
                                <Switch checked={formData.credentialledCommunityLanguage} onCheckedChange={(v) => setFormData({ ...formData, credentialledCommunityLanguage: v })} />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Regional Study</Label>
                                    <p className="text-sm text-muted-foreground">Study in regional Australia</p>
                                </div>
                                <Switch checked={formData.regionalStudy} onCheckedChange={(v) => setFormData({ ...formData, regionalStudy: v })} />
                            </div>
                        </div>

                        <Separator />

                        {/* Partner & Nomination */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>{language === "ar" ? "الحالة الاجتماعية / مهارات الشريك" : "Marital Status / Partner Skills"}</Label>
                                <Select
                                    value={formData.partnerSkills}
                                    onValueChange={(v: any) => setFormData({ ...formData, partnerSkills: v })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="single">Single (10 pts)</SelectItem>
                                        <SelectItem value="partner_skilled">Partner with Skills + Competent English (10 pts)</SelectItem>
                                        <SelectItem value="partner_english">Partner with Competent English only (5 pts)</SelectItem>
                                        <SelectItem value="partner_pr">Partner is Australian PR/Citizen (10 pts)</SelectItem>
                                        <SelectItem value="partner_no_points">Partner with no eligible skills/english (0 pts)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label>{language === "ar" ? "الترشيح" : "Nomination / Sponsorship"}</Label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                                            <TooltipContent className="max-w-xs">
                                                <p>Subclass 190 (State Nomination) gives 5 pts. Subclass 491 (Regional/Family) gives 15 pts.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <Select
                                    value={formData.nomination}
                                    onValueChange={(v: any) => setFormData({ ...formData, nomination: v })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No Nomination (189 Visa)</SelectItem>
                                        <SelectItem value="state_190">State Nomination (190 Visa) +5 pts</SelectItem>
                                        <SelectItem value="regional_491">Regional/Family Sponsorship (491 Visa) +15 pts</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                    </CardContent>
                </Card>
            </div>

            {/* Results Sidebar */}
            <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-4">
                    {/* Score Card */}
                    <Card className={cn("border-2 transition-colors", result && result.totalScore >= 65 ? "border-green-500" : "border-primary")}>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Award className="h-5 w-5 text-primary" />
                                {t("calculator.yourScore")}
                            </CardTitle>
                            <CardDescription>
                                Minimum 65 points required
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center p-6 bg-primary/5 rounded-lg mb-4">
                                <div className="text-5xl font-bold text-primary animate-in zoom-in duration-300">
                                    {result?.totalScore || 0}
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Total Points
                                </p>
                            </div>

                            <Button onClick={handleSave} className="w-full" disabled={saveMutation.isPending}>
                                {saveMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Assessment
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Breakdown */}
                    {result && (
                        <Card>
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Age</span>
                                    <span className="font-medium">{result.breakdown.age}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">English</span>
                                    <span className="font-medium">{result.breakdown.english}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Experience</span>
                                    <span className="font-medium">{result.breakdown.experience}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Education</span>
                                    <span className="font-medium">{result.breakdown.education}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Specialist Edu</span>
                                    <span className="font-medium">{result.breakdown.specialistEducation > 0 ? `+${result.breakdown.specialistEducation}` : '-'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Partner</span>
                                    <span className="font-medium">{result.breakdown.partner}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Nomination</span>
                                    <span className="font-medium">{result.breakdown.nomination}</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Invitation Rounds Banner (Static for MVP) */}
                    <Card className="bg-muted/50">
                        <CardHeader className="py-4">
                            <CardTitle className="text-sm">Recent Invitation Rounds</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2 pb-4 text-xs space-y-2">
                            <div className="flex justify-between">
                                <span>Subclass 189 (General)</span>
                                <span className="font-semibold">65+ pts</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Subclass 190 (NSW)</span>
                                <span className="font-semibold">85+ pts</span>
                            </div>
                            <div className="text-muted-foreground text-[10px] mt-2 italic">
                                *Scores vary heavily by occupation and state.
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    )
}
