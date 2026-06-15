import prisma from '../../config/database';
import { HttpError } from '../../common/middlewares/error.middleware';
import { env } from '../../config/env';

const serializeProfile = (p: any) => ({
  id: Number(p.id),
  app_name: p.app_name,
  app_tagline: p.app_tagline,
  primary_color: p.primary_color,
  name: p.name, npsn: p.npsn, address: p.address,
  city: p.city, province: p.province, phone: p.phone,
  email: p.email, website: p.website,
  logo: p.logo ? (p.logo.startsWith('http') ? p.logo : `${env.APP_URL}${p.logo.startsWith('/') ? '' : '/'}${p.logo}`) : null,
  principal_name: p.principal_name, principal_nip: p.principal_nip,
  curriculum_name: p.curriculum_name, curriculum_nip: p.curriculum_nip,
  report_footer: p.report_footer,
  created_at: p.created_at?.toISOString(), updated_at: p.updated_at?.toISOString(),
});

const serializeReportSetting = (r: any) => ({
  id: Number(r.id),
  show_logo: r.show_logo, show_school_address: r.show_school_address,
  show_principal_signature: r.show_principal_signature, show_supervisor_signature: r.show_supervisor_signature,
  show_curriculum_signature: r.show_curriculum_signature, use_qr_validation: r.use_qr_validation,
  document_number_format: r.document_number_format, paper_size: r.paper_size,
  orientation: r.orientation, header_style: r.header_style,
  watermark_text: r.watermark_text, footer_text: r.footer_text,
  updated_at: r.updated_at?.toISOString(),
});

const serializeAppPref = (a: any) => ({
  id: Number(a.id),
  auto_use_active_period: a.auto_use_active_period, auto_save_assessment: a.auto_save_assessment,
  require_note_for_low_score: a.require_note_for_low_score, low_score_threshold: a.low_score_threshold,
  default_score_max: a.default_score_max, enable_wa_notification: a.enable_wa_notification,
  enable_reflection_reminder: a.enable_reflection_reminder, updated_at: a.updated_at?.toISOString(),
});

export const settingsService = {
  async getSchoolProfile() {
    let profile = await prisma.schoolProfile.findFirst();
    if (!profile) profile = await prisma.schoolProfile.create({ data: { name: 'Nama Sekolah' } });
    return serializeProfile(profile);
  },

  async updateSchoolProfile(data: any) {
    const profile = await prisma.schoolProfile.findFirst();
    const updated = profile
      ? await prisma.schoolProfile.update({ where: { id: profile.id }, data })
      : await prisma.schoolProfile.create({ data: { name: data.name ?? 'Nama Sekolah', ...data } });
    return serializeProfile(updated);
  },

  async updateSchoolLogo(logoPath: string) {
    const profile = await prisma.schoolProfile.findFirst();
    
    if (profile?.logo) {
      const { deleteOldFileIfExists } = require('../../common/utils/image');
      deleteOldFileIfExists(profile.logo);
    }
    
    const updated = profile
      ? await prisma.schoolProfile.update({ where: { id: profile.id }, data: { logo: logoPath } })
      : await prisma.schoolProfile.create({ data: { name: 'Nama Sekolah', logo: logoPath } });
      
    return serializeProfile(updated);
  },

  async getReportSettings() {
    let settings = await prisma.reportSetting.findFirst();
    if (!settings) settings = await prisma.reportSetting.create({ data: {} });
    return serializeReportSetting(settings);
  },

  async updateReportSettings(data: any) {
    const settings = await prisma.reportSetting.findFirst();
    const updated = settings
      ? await prisma.reportSetting.update({ where: { id: settings.id }, data })
      : await prisma.reportSetting.create({ data });
    return serializeReportSetting(updated);
  },

  async getAppPreferences() {
    let prefs = await prisma.appPreference.findFirst();
    if (!prefs) prefs = await prisma.appPreference.create({ data: {} });
    return serializeAppPref(prefs);
  },

  async updateAppPreferences(data: any) {
    const prefs = await prisma.appPreference.findFirst();
    const updated = prefs
      ? await prisma.appPreference.update({ where: { id: prefs.id }, data })
      : await prisma.appPreference.create({ data });
    return serializeAppPref(updated);
  },
};
