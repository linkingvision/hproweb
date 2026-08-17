export interface AlarmOption {
  label: string
  value: string
  icon?: string
  status?: boolean
}

export interface AlarmStateOption {
  label: string
  value: string
  code: number
  countKey?: string
}

export interface AlarmLevelOption {
  code: string | number
  level: string
  color?: string
}

type TranslateFn = (key: string) => string

export const ALARM_CLOSE_REASON = 'USC_SYS_EV_RESOLVED_PROBLEM'

export const getSystemEventOptions = (t: TranslateFn): AlarmOption[] => [
  { value: 'H5S_EVENT_ONLINE', label: t('Event.event_online_status'), status: true },
  { value: 'H5S_EVENT_OFFLINE', label: t('Event.event_offline_status'), status: false },
  { value: 'H5S_EVENT_MOTION', label: t('Event.event_motion_detection'), status: false },
  { value: 'H5S_EVENT_CROSS_LINE', label: t('Event.event_cross_line'), status: false },
  { value: 'H5S_EVENT_FIELD_DETECTION', label: t('Event.event_field_detection'), status: false },
  { value: 'H5S_EVENT_SMOKE_DETECTION', label: t('Event.event_smoke_detection'), status: false },
  { value: 'H5S_EVENT_CONS_VEHI_DETECTION', label: t('Event.event_cons_vehi_detection'), status: false }
]

export const getAnalysisEventOptions = (t: TranslateFn): AlarmOption[] => [
  { label: t('Analytics.ana_rule_ppe'), value: 'USC_ANA_RULE_PPE', icon: 'icon-a-Safetyhat', status: false },
  { label: t('Analytics.ana_rule_miaa'), value: 'USC_ANA_RULE_MIAA', icon: 'icon-quyuruqin', status: false },
  { label: t('Analytics.ana_rule_pefa'), value: 'USC_ANA_RULE_PEFA', icon: 'icon-diedaojiance', status: false },
  { label: t('Analytics.ana_rule_cral'), value: 'USC_ANA_RULE_CRAL', icon: 'icon-banxianjiance', status: false },
  { label: t('Analytics.ana_rule_loit'), value: 'USC_ANA_RULE_LOIT', icon: 'icon-renyuandouliu', status: false },
  { label: t('Analytics.ana_rule_stve'), value: 'USC_ANA_RULE_STVE', icon: 'icon-weifatingche', status: false },
  { label: t('Analytics.ana_rule_vect'), value: 'USC_ANA_RULE_VECT', icon: 'icon-cheliangjishu', status: false },
  { label: t('Analytics.ana_rule_pect'), value: 'USC_ANA_RULE_PECT', icon: 'icon-renyuanjishu', status: false },
  { label: t('Analytics.ana_rule_fism'), value: 'USC_ANA_RULE_FISM', icon: '', status: false },
  { label: t('Analytics.ana_rule_fblk'), value: 'USC_ANA_RULE_FBLK', icon: 'icon-xiaofangtongdaozhanyong', status: false },
  { label: t('Analytics.ana_rule_figt'), value: 'USC_ANA_RULE_FIGT', icon: 'icon-shandongnaoshi', status: false }
]

export const getAlarmStateOptions = (t: TranslateFn, includeAll = false): AlarmStateOption[] => {
  const options: AlarmStateOption[] = [
    { label: t('AlarmConfig.ala_new'), value: 'New', code: 1, countKey: 'new' },
    { label: t('AlarmConfig.ala_in_progress'), value: 'In progress', code: 2, countKey: 'inProgress' },
    { label: t('AlarmConfig.ala_on_hold'), value: 'On hold', code: 3, countKey: 'onHold' },
    { label: t('AlarmConfig.ala_closed'), value: 'Closed', code: 4, countKey: 'closed' }
  ]

  if (!includeAll) return options

  return [
    { label: t('System.sys_all'), value: 'All', code: 0, countKey: 'all' },
    ...options
  ]
}

export const getAllEventOptions = (t: TranslateFn) => [
  ...getSystemEventOptions(t),
  ...getAnalysisEventOptions(t)
]

export const formatModuleType = (value: string | undefined, t: TranslateFn) => {
  if (!value) return ''
  if (value === 'H5S_EVENT_DEV_ONLINE') return t('Event.event_online_status')
  if (value === 'H5S_EVENT_DEV_OFFLINE') return t('Event.event_offline_status')
  return getAllEventOptions(t).find(item => item.value === value)?.label || value
}

export const formatAlarmState = (value: string | number | undefined, t: TranslateFn) => {
  if (value === undefined || value === null || value === '') return ''
  const states = getAlarmStateOptions(t, true)
  return states.find(item => item.value === value || item.code === Number(value))?.label || String(value)
}

export const formatAlarmLevel = (value: string | number | undefined, levels: AlarmLevelOption[]) => {
  if (value === undefined || value === null || value === '') return ''
  return levels.find(item => String(item.code) === String(value))?.level || String(value)
}

export const getAlarmLevelColor = (value: string | number | undefined, levels: AlarmLevelOption[]) => {
  if (value === undefined || value === null || value === '') return ''
  return levels.find(item => String(item.code) === String(value))?.color || ''
}
