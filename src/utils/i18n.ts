export type Language = 'ar' | 'en';

export function getDirection(lang: Language): 'rtl' | 'ltr' {
  return lang === 'ar' ? 'rtl' : 'ltr';
}

export const SERVICE_COPY: Record<
  string,
  {
    en: {
      title: string;
      shortDesc: string;
      fullDesc: string;
      deliverables: string[];
    };
  }
> = {
  'srv-commercials': {
    en: {
      title: 'Commercial & Promotional Video Production',
      shortDesc: 'High-impact visual campaigns that build brand identity and drive engagement.',
      fullDesc:
        'Concept-to-delivery commercial production including creative scriptwriting, cinema-grade filming, and multi-platform campaign edits.',
      deliverables: ['Creative Scriptwriting', '4K/6K Cinema Filming', 'Social-Ready Cutdowns'],
    },
  },
  'srv-films-tv': {
    en: {
      title: 'Short Films & TV Programs',
      shortDesc: 'End-to-end storytelling from initial treatment to broadcast delivery.',
      fullDesc:
        'Full production of short films, documentaries, and television programs led by experienced directors and cinematographers.',
      deliverables: ['Production & Location Management', 'Artistic Direction', 'Broadcast Studio Setup'],
    },
  },
  'srv-cinematography': {
    en: {
      title: 'High-Definition Video Filming & Editing',
      shortDesc: 'Cinema lenses, studio lighting, and seamless editorial pacing.',
      fullDesc:
        'Event coverage, corporate documentaries, and field shoots captured with modern cinema cameras and precision stabilization.',
      deliverables: ['Multi-Camera Live Coverage', 'Aerial Drone Cinematography', 'Precision Editorial Cut'],
    },
  },
  'srv-podcast': {
    en: {
      title: 'Podcast & Interview Production',
      shortDesc: 'Acoustically treated studios with multi-angle video recording.',
      fullDesc:
        'Audio and video podcast recording featuring broadcast microphones, warm studio lighting, and clean audio engineering.',
      deliverables: ['Audio Mastering & Cleanup', '3-Angle Video Setup', 'Short-Form Highlights'],
    },
  },
  'srv-post': {
    en: {
      title: 'Comprehensive Post-Production Services',
      shortDesc: 'Editing, cinema color grading, VFX, and sound mixing.',
      fullDesc:
        'Complete post-production suite covering narrative editing, color grading, motion graphics, and broadcast audio mastering.',
      deliverables: ['Cinema Color Grading', 'Motion Graphics & VFX', 'Broadcast Audio Mixing'],
    },
  },
};

export const UI_COPY = {
  ar: {
    nav: {
      hero: 'الرئيسية',
      services: 'خدماتنا',
      about: 'من نحن',
      licenses: 'التراخيص',
      contact: 'تواصل معنا',
      openMenu: 'فتح القائمة',
      closeMenu: 'إغلاق القائمة',
    },
    hero: {
      companyName: 'شركة الخليج للإنتاج الفني',
      tagline:
        'نحوّل الأفكار إلى تجارب بصرية جذابة تترك أثراً دائماً لدى الجمهور — حلول مبتكرة وشاملة في صناعة المحتوى الإعلامي المرئي والسمعي.',
      ctaServices: 'استكشف خدماتنا',
      ctaYoutube: 'قناة اليوتيوب',
      hint3d: 'حرّك الماوس أو مرّر للأسفل للتفاعل مع المشهد، أو اسحب لتدوير الاستوديو أو ارفع .GLB',
      publicHint3d: 'حرّك الماوس أو مرّر للأسفل للتفاعل مع الاستوديو ثلاثي الأبعاد، أو اسحب للتدوير',
      openCustomizer: 'إضافة الشعار أو ملف 3D',
      langLabel: 'اللغة',
    },
    dock: {
      cinematic: 'سينمائي',
      front: 'أمامي',
      lens: 'العدسة',
      wide: 'شامل',
      rotate: 'دوران',
      upload: 'رفع 3D',
      hide: 'إخفاء',
      show: 'عرض الأدوات',
      restore: 'استعادة الافتراضي',
      loadedPrefix: 'تم تحميل المجسم:',
      parseError: 'تعذر قراءة الملف. تأكد من أن الملف بصيغة GLB أو GLTF صالحة.',
    },
    expertiseStripTitle: 'مجالات الخبرة',
    about: {
      kicker: 'نبذة عن الشركة والفريق الإبداعي',
      summary:
        'شركة الخليج للإنتاج الفني هي شركة رائدة في مجال الإعلام والإنتاج المرئي والسمعي، متخصصة في تقديم حلول مبتكرة وشاملة في صناعة المحتوى الإعلامي حيث تسعى الشركة إلى تحويل الأفكار إلى تجارب بصرية جذابة تترك أثراً دائماً لدى الجمهور.',
      teamTitle: 'فريق عمل متكامل',
      teamBody:
        'يتألف الفريق من مجموعة من محترفي الإخراج والتصوير والتحرير والكتابة الإبداعية، يعملون بتكامل تام لضمان أعلى معايير الجودة السينمائية والسمعية في كل مشروع.',
      ctaServices: 'استعراض الخدمات التفصيلية',
      ctaYoutube: 'زيارة قناة اليوتيوب',
    },
    services: {
      kicker: 'خدماتنا',
      heading: 'حلول الإنتاج الإعلامي الاحترافية',
      subheading: 'نغطي دورة الإنتاج المرئي والسمعي بالكامل بدءاً من بلورة الفكرة وحتى البث والنشر الرقمي.',
      detailsBtn: 'عرض التفاصيل والمخرجات',
      modalOrderPrefix: 'خدمة رقم',
      deliverablesTitle: 'أبرز المخرجات:',
      close: 'إغلاق',
      quoteBtn: 'اطلب عرض سعر لهذه الخدمة',
      processTitle: 'مراحل الإنتاج لدينا',
      steps: [
        { step: '01', title: 'الفكرة', desc: 'فهم رؤيتك وصياغة المعالجة الإبداعية' },
        { step: '02', title: 'التخطيط', desc: 'جدولة التصوير واختيار المواقع والطاقم' },
        { step: '03', title: 'الإنتاج', desc: 'تنفيذ التصوير والتسجيل بأحدث المعدات' },
        { step: '04', title: 'التسليم', desc: 'المونتاج والتلوين والتسليم بأعلى دقة' },
      ],
    },
    goldBanner: {
      title: 'لنصنع معاً عملاً إبداعياً استثنائياً يترك أثراً دائماً',
      cta: 'ابدأ مشروعك الآن',
    },
    licenses: {
      kicker: 'الاعتماد الرسمي والتراخيص الإقليمية',
      heading: 'التراخيص والاعتمادات المعتمدة',
      subheading:
        'سجل موثق لتراخيص الإنتاج الإعلامي والتجاري حسب الدولة، مع إمكانية رفع ملفات PDF وتنظيمها وتنزيلها عبر وضع الأدمن.',
      publicSubheading:
        'تلتزم شركة الخليج للإنتاج الفني بكافة الضوابط والتراخيص الرسمية المعتمدة في جميع الدول التي تعمل بها، مع إمكانية معاينة وتنزيل ملفات PDF.',
      allRegions: 'كل الدول',
      addBtn: 'إضافة ترخيص جديد',
      addToRegionBtn: 'إضافة ترخيص لهذه الدولة',
      manageBtn: 'إدارة الشعار والملفات',
      emptyTitle: 'لا توجد تراخيص مضافة لهذه الدولة حالياً',
      emptyDesc: 'يمكنك إضافة التراخيص وملفات PDF الخاصة بهذه الدولة ليتم عرضها وتنزيلها من قبل العملاء.',
      addFirstBtn: 'إضافة ترخيص جديد',
      fields: {
        region: 'الدولة / المنطقة',
        number: 'رقم الترخيص',
        issue: 'تاريخ الإصدار',
        expiry: 'تاريخ الانتهاء',
        authority: 'الجهة المانحة',
        validity: 'المدة الزمنية',
        category: 'الفئة',
      },
      pdfAttached: 'مرفق رسمي',
      pdfReady: 'جاهز للتحميل',
      viewDoc: 'معاينة',
      viewDetails: 'معاينة',
      downloadPdf: 'تنزيل PDF',
      downloadingPdf: 'جاري التجهيز...',
      closePreview: 'إغلاق المعاينة',
      modalAddTitle: 'إضافة ترخيص أو اعتماد جديد',
      modalEditTitle: 'تعديل بيانات الترخيص',
      formRegion: 'الدولة / المنطقة *',
      formTitle: 'اسم الترخيص / الشهادة *',
      formAuthority: 'الجهة المانحة *',
      formNumber: 'رقم الترخيص *',
      formCategory: 'المجال / الفئة *',
      formIssue: 'تاريخ الإصدار *',
      formExpiry: 'تاريخ الانتهاء *',
      formNotes: 'ملاحظات إضافية',
      formAttachment: 'رفع ملف الترخيص بصيغة PDF (الحد الأقصى 500 كيلوبايت)',
      chooseFile: 'اختر ملف PDF للرفع',
      removeFile: 'إزالة الملف',
      cancel: 'إلغاء',
      saveEdit: 'حفظ التعديلات',
      saveNew: 'حفظ وإضافة الترخيص',
      downloadDoc: 'تنزيل ملف PDF',
      countSingle: 'ترخيص واحد',
      countPlural: 'تراخيص',
    },
    contact: {
      kicker: 'تواصل معنا',
      heading: 'لنصنع مشروعك القادم معاً',
      subheading:
        'تواصل مع فريق شركة الخليج للإنتاج الفني لمناقشة فكرتك الإعلانية أو التلفزيونية أو حجز استوديو البودكاست.',
      directTitle: 'معلومات الاتصال المباشر',
      phoneHint: 'اتصل بنا في أي وقت',
      emailHint: 'راسلنا عبر البريد الإلكتروني / Gmail',
      locationHint: 'موقع المقر والاستوديو',
      socialHeading: 'قناة اليوتيوب ومواقع التواصل الاجتماعي',
      formTitle: 'أرسل لنا رسالة',
      successTitle: 'تم استلام رسالتك بنجاح يا',
      successSub: 'سيتواصل معك فريق الإنتاج لدينا عبر البريد',
      nameLabel: 'الاسم الكامل *',
      namePlaceholder: 'أدخل اسمك',
      emailLabel: 'البريد الإلكتروني / Gmail *',
      subjectLabel: 'موضوع المشروع',
      subjectPlaceholder: 'إعلان تجاري، بودكاست، فيلم قصير...',
      messageLabel: 'تفاصيل الرسالة *',
      messagePlaceholder: 'شاركنا تفاصيل فكرتك أو متطلبات الإنتاج...',
      submitBtn: 'إرسال الرسالة',
      ourLocation: 'موقعنا',
      locationDesc:
        'يسعدنا استقبالكم في استوديوهاتنا ومقر الشركة لمناقشة مشاريعكم الإعلامية وتنسيق مواعيد التصوير.',
      openMaps: 'فتح الموقع على خرائط جوجل',
    },
    footer: {
      tagline: 'إعلام . إبداع . تأثير',
      customize: 'تخصيص الشعار وملف 3D',
    },
  },
  en: {
    nav: {
      hero: 'Home',
      services: 'Services',
      about: 'About',
      licenses: 'Licenses',
      contact: 'Get in Touch',
      openMenu: 'Open Menu',
      closeMenu: 'Close Menu',
    },
    hero: {
      companyName: 'Abc Gulf Productions',
      tagline:
        'Turning ideas into compelling visual experiences that leave a lasting impression — innovative, end-to-end audiovisual media production solutions.',
      ctaServices: 'Explore Our Services',
      ctaYoutube: 'YouTube Channel',
      hint3d: 'Move mouse or scroll down to interact, drag to orbit, or upload your .GLB model',
      publicHint3d: 'Move your mouse or scroll down to interact with the 3D studio, or drag to orbit',
      openCustomizer: 'Customize Logo & 3D File',
      langLabel: 'Language',
    },
    dock: {
      cinematic: 'Cinematic',
      front: 'Front',
      lens: 'Lens',
      wide: 'Wide',
      rotate: 'Rotate',
      upload: 'Upload 3D',
      hide: 'Hide',
      show: 'Controls',
      restore: 'Restore Default',
      loadedPrefix: 'Loaded model:',
      parseError: 'Could not parse file. Ensure it is a valid GLB or GLTF model.',
    },
    expertiseStripTitle: 'Areas of Expertise',
    about: {
      kicker: 'About Us & Creative Team',
      summary:
        'Abc Gulf Productions (شركة الخليج للإنتاج الفني) is a leading media and audiovisual production company specialized in delivering innovative, comprehensive content solutions — transforming concepts into engaging visual experiences that leave a lasting impact.',
      teamTitle: 'Multidisciplinary Creative Team',
      teamBody:
        'Our team brings together seasoned professionals in directing, cinematography, editing, and creative writing, collaborating seamlessly to deliver cinema-grade visual and audio quality.',
      ctaServices: 'View Detailed Services',
      ctaYoutube: 'Visit YouTube Channel',
    },
    services: {
      kicker: 'Our Services',
      heading: 'Professional Production Services',
      subheading: 'We handle the entire audiovisual production pipeline from initial concept to broadcast and digital delivery.',
      detailsBtn: 'View Details & Deliverables',
      modalOrderPrefix: 'Service',
      deliverablesTitle: 'Key Deliverables:',
      close: 'Close',
      quoteBtn: 'Request a Quote for This Service',
      processTitle: 'Our Production Process',
      steps: [
        { step: '01', title: 'Concept', desc: 'Understanding your vision & creative treatment' },
        { step: '02', title: 'Planning', desc: 'Scheduling shoots, locations & production crew' },
        { step: '03', title: 'Production', desc: 'Filming & recording with cinema-grade gear' },
        { step: '04', title: 'Delivery', desc: 'Editing, color grading & master delivery' },
      ],
    },
    goldBanner: {
      title: "Let's Create Something Extraordinary Together",
      cta: 'Start Your Project',
    },
    licenses: {
      kicker: 'Official Regional Accreditations',
      heading: 'Regional Licenses & Permits',
      subheading:
        'Official media production permits organized by country, with direct PDF document uploads and downloads in Admin Mode.',
      publicSubheading:
        'Abc Gulf Productions maintains accredited media production licenses grouped by country, available to preview and download as PDF.',
      allRegions: 'All Countries',
      addBtn: 'Add New License',
      addToRegionBtn: 'Add License Here',
      manageBtn: 'Manage Logo & Assets',
      emptyTitle: 'No licenses added for this country yet',
      emptyDesc: 'Add official production permits and PDF certificates for this country to share with clients.',
      addFirstBtn: 'Add New License',
      fields: {
        region: 'Country / Region',
        number: 'License No.',
        issue: 'Issue Date',
        expiry: 'Expiry Date',
        authority: 'Issuing Authority',
        validity: 'Date Range',
        category: 'Category',
      },
      pdfAttached: 'Uploaded',
      pdfReady: 'Downloadable',
      viewDoc: 'Preview',
      viewDetails: 'Preview',
      downloadPdf: 'Download PDF',
      downloadingPdf: 'Preparing...',
      closePreview: 'Close Preview',
      modalAddTitle: 'Add New License or Permit',
      modalEditTitle: 'Edit License Details',
      formRegion: 'Country / Region *',
      formTitle: 'License / Certificate Title *',
      formAuthority: 'Issuing Authority *',
      formNumber: 'License Number *',
      formCategory: 'Category / Scope *',
      formIssue: 'Issue Date *',
      formExpiry: 'Expiry Date *',
      formNotes: 'Additional Notes',
      formAttachment: 'Upload License PDF File (Max 500 KB)',
      chooseFile: 'Choose PDF file to upload',
      removeFile: 'Remove file',
      cancel: 'Cancel',
      saveEdit: 'Save Changes',
      saveNew: 'Save & Add License',
      downloadDoc: 'Download PDF',
      countSingle: '1 License',
      countPlural: 'Licenses',
    },
    contact: {
      kicker: 'Contact Us',
      heading: "Let's Create Your Next Project",
      subheading:
        'Reach out to Abc Gulf Productions to discuss your commercial campaign, short film, or podcast studio booking.',
      directTitle: 'Get in Touch',
      phoneHint: 'Call us anytime',
      emailHint: 'Drop us an email / Gmail',
      locationHint: 'Studio & Office Location',
      socialHeading: 'YouTube & Social Media',
      formTitle: 'Send Us a Message',
      successTitle: 'Message received, ',
      successSub: 'Our production team will reach out to you via email at',
      nameLabel: 'Full Name *',
      namePlaceholder: 'Your Name',
      emailLabel: 'Email / Gmail *',
      subjectLabel: 'Project Subject',
      subjectPlaceholder: 'Commercial, Podcast, Short Film...',
      messageLabel: 'Your Message *',
      messagePlaceholder: 'Share your project details or production requirements...',
      submitBtn: 'Send Message',
      ourLocation: 'Our Location',
      locationDesc:
        'Visit us at our studio and office to discuss your upcoming media productions or schedule a shoot.',
      openMaps: 'Get Directions on Google Maps',
    },
    footer: {
      tagline: 'Media. Creativity. Impact.',
      customize: 'Customize Logo & 3D File',
    },
  },
} as const;
