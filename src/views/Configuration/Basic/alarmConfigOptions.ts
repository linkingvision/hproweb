export interface AlarmEventOption {
  label: string
  value: string
  icon?: string
}

export interface TimeTemplateOption {
  id: number
  name: string
  uuid: string
}

export interface AlarmOwnerOption {
  uuid: string
  username: string
}

export interface AlarmLevelOption {
  id?: number
  code: string | number
  level: string
  color?: string
}

export function getSystemEventOptions(t: (key: string) => string): AlarmEventOption[] {
  return [{
    value: 'H5S_EVENT_ONLINE',
    label: t('Event.event_online_status')
  }, {
    value: 'H5S_EVENT_OFFLINE',
    label: t('Event.event_offline_status')
  }, {
    value: 'H5S_EVENT_MOTION',
    label: t('Event.event_motion_detection')
  }, {
    value: 'H5S_EVENT_CROSS_LINE',
    label: t('Event.event_cross_line')
  }, {
    value: 'H5S_EVENT_FIELD_DETECTION',
    label: t('Event.event_field_detection')
  }, {
    value: 'H5S_EVENT_SMOKE_DETECTION',
    label: t('Event.event_smoke_detection')
  }, {
    value: 'H5S_EVENT_CONS_VEHI_DETECTION',
    label: t('Event.event_cons_vehi_detection')
  }]
}

export function getAnalyticsEventOptions(t: (key: string) => string): AlarmEventOption[] {
  return [
    { label: t('Analytics.ana_rule_ppe'), value: 'USC_ANA_RULE_PPE', icon: 'icon-a-Safetyhat' },
    { label: t('Analytics.ana_rule_miaa'), value: 'USC_ANA_RULE_MIAA', icon: 'icon-quyuruqin' },
    { label: t('Analytics.ana_rule_pefa'), value: 'USC_ANA_RULE_PEFA', icon: 'icon-diedaojiance' },
    { label: t('Analytics.ana_rule_cral'), value: 'USC_ANA_RULE_CRAL', icon: 'icon-banxianjiance' },
    { label: t('Analytics.ana_rule_loit'), value: 'USC_ANA_RULE_LOIT', icon: 'icon-renyuandouliu' },
    { label: t('Analytics.ana_rule_stve'), value: 'USC_ANA_RULE_STVE', icon: 'icon-weifatingche' },
    { label: t('Analytics.ana_rule_vect'), value: 'USC_ANA_RULE_VECT', icon: 'icon-cheliangjishu' },
    { label: t('Analytics.ana_rule_pect'), value: 'USC_ANA_RULE_PECT', icon: 'icon-renyuanjishu' },
    { label: t('Analytics.ana_rule_fism'), value: 'USC_ANA_RULE_FISM' },
    { label: t('Analytics.ana_rule_fblk'), value: 'USC_ANA_RULE_FBLK', icon: 'icon-xiaofangtongdaozhanyong' },
    { label: t('Analytics.ana_rule_figt'), value: 'USC_ANA_RULE_FIGT', icon: 'icon-shandongnaoshi' }
  ]
}

export function formatTimeTemplateName(name: string, t: (key: string) => string) {
  const nameMap: Record<string, string> = {
    'Everyday template': t('Setting.set_everyday_template'),
    'Weekend template': t('Setting.set_weekend_template'),
    'Workday template': t('Setting.set_workday_template'),
    'Public holiday template': t('Setting.set_public_holiday_template'),
    'Empty Template': t('Setting.set_empty_template')
  }
  return nameMap[name] ?? name
}
