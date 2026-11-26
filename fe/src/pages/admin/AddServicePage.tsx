import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useServices } from '../../hooks/useServices';
import { useToast } from '../../contexts/ToastContext';

const BRAND_CATEGORIES = [
  'Fitness',
  'Yoga',
  'Dance',
  'Music',
  'Sports',
  'Rejuvenation',
  'Combat sports',
  'Admin Fee',
  'Consultation',
  'Salon',
  'Ayurvedic Treatment',
];

const AKTVITY_CATEGORIES = [
  'Fitness Training',
  'Wellness Sessions',
  'Sports Coaching',
  'Book a Venue',
  'Adventure Programs',
  'Dance',
  'Pickleball',
];

const CATEGORY_CHECKBOX_ACTIVITIES: Record<string, string[]> = {
  Fitness: [
    'Body Building',
    'Strength',
    'Cardio',
    'Pilates',
    'Barre',
    'Spinning',
    'Boot Camp',
    'Zumba',
    'Weight Loss',
    'Weight Management',
    'Slimming',
    'Aqua Fitness',
    'Crossfit',
    'Aerobics',
    'Personal Session',
    'Group Workout',
    'Gym Workout',
    'Functional Training',
  ],
  Yoga: [
    'Yoga',
    'Traditional Yoga',
    'Hot Yoga',
    'Power Yoga',
    'Bikram Yoga',
    'Hatha Yoga',
    'Kundalini Yoga',
    'Vinyasa Yoga',
    'Ashtanga Yoga',
    'Prenatal Yoga',
    'Aerial Yoga',
    'Artistic Yoga',
    'Personal Session',
    'Workshop',
  ],
  Dance: [
    'Salsa',
    'Hiphop',
    'Jazz',
    'Jive',
    'Bollywood',
    'Folk',
    'Ballet',
    'Latin',
    'Ball Room',
    'Rumba',
    'Hollywood',
    'B-Boying',
    'Street',
    'Tango',
    'Bhangra',
    'Bharatanatyam',
    'Kathak',
    'Kathakali',
    'Kuchipudi',
    'Manipuri',
    'Oddisi',
    'Sattriya',
    'Mohiniattam',
    'Freestyle Dance',
    'Personal Session',
    'Workshop',
    'Belly Dance',
  ],
  Music: [
    'Keyboard',
    'Guitar',
    'Drums',
    'Vocals',
    'Bass',
    'Harmonium',
    'Tabla',
    'Violin',
    'Mrudanga',
    'Flute',
    'Veena',
    'Personal Session',
    'Workshop',
  ],
  Sports: [
    'Aquatics',
    'Automobile Racing',
    'Badminton',
    'Baseball',
    'Basketball',
    'Beach Volleyball',
    'Bowling',
    'Camping',
    'Canoeing',
    'Cheerleading',
    'Chess',
    'Cricket',
    'Cross Country Running',
    'Cycling',
    'Darts',
    'Decathlon',
    'Diving',
    'Dog Training',
    'Equestrianism',
    'Figure Skating',
    'Football',
    'Golf',
    'Gymnastics',
    'Hand Ball',
    'High Jump',
    'Hiking',
    'Hockey',
    'Hot Air Ballooning',
    'Ice Skating',
    'Inline Skating',
    'Jai Alai',
    'Kayaking',
    'Knee Boarding',
    'Long Jump',
    'Motorcycle Racing',
    'Mountain Biking',
    'Mountaineering',
    'Netball',
    'Paint Ball',
    'Para Gliding',
    'Parachuting',
    'River Rafting',
    'Rock Climbing',
    'Roller Skating',
    'Rowing',
    'Rugby',
    'Sailing',
    'Scuba Diving',
    'Shooting',
    'Shot Put',
    'Skateboarding',
    'Snooker',
    'Soccer',
    'Sprint Running',
    'Squash',
    'Surfing',
    'Swimming',
    'Table Tennis',
    'Tennis',
    'Track And Field',
    'Triathlon',
    'Tug Of War',
    'Volleyball',
    'Water Polo',
    'Water Skiing',
    'Weight Lifting',
    'Wheelchair Basketball',
    'White Water Rafting',
    'Wind Surfing',
    'Yachting',
    'Self-Defence',
    'Running',
    'Personal Session',
    'Workshop',
    'Kabaddi',
    'Kho Kho',
  ],
  Rejuvenation: [
    'Aromatherapy',
    'Deep Tissue Massage',
    'Head Massage',
    'Foot Massage',
    'Massage',
    'Swedish Massage',
    'Thai Massage',
    'Reflexology',
    'Shiatsu',
    'Tui Na',
    'Acupuncture',
    'Qi Gong',
    'Ayurvedic Treatments',
    'Meditation',
    'Chiropractic',
    'Tai Chi',
    'Reiki',
    'Acupressure',
    'Cupping',
    'Personal Session',
    'Workshop',
  ],
  'Combat sports': [
    'Archery',
    'Boxing',
    'Fencing',
    'Judo',
    'Karate',
    'Taekwondo',
    'Wrestling',
    'Kickboxing',
    'Brazilian Jiu-Jitsu',
    'Kung Fu',
    'Mixed Martial Arts',
    'Muay Thai',
    'Kalaripayattu',
  ],
  'Admin Fee': [
    'Registration Fee',
    'Transfer Fee',
    'Locker Fee',
  ],
  Consultation: [
    'Consultation',
  ],
  Salon: [
    'Beauty',
    'Hair',
    'Nail',
    'Eyebrows And Lashes',
    'Waxing',
    'Tattoo And Piercing',
    'Aesthetics',
    'Tanning',
  ],
  'Ayurvedic Treatment': [
    'Abhyanga',
    'Head And Foot Massage',
    'Ekanga Abhyanga',
    'Udvartana',
    'Takradhara',
    'Shirodhara',
    'Swarna Prashana',
    'Virechana',
    'Vamana',
    'Nasya',
    'Yoga Basti',
    'Kala Basti',
    'Kati Basti',
    'Greeva Basti',
    'Prusta Basti',
    'Janu Basti',
    'Slim Down',
    'Get Fit',
    'Fat To Fab',
    'Lose It All',
    'Rediscover Yourself',
    'Scrap Your Fat',
    'Tone Your Body',
    'Slimtox',
  ],
};

const ALL_AKTVITY_TAGS = [
  'Select',
  'Acupuncture',
  'Aerial Fitness',
  'Archery',
  'B-Boying',
  'Badminton',
  'Badminton Court',
  'Ballet',
  'Ballroom',
  'Barre',
  'Basketball',
  'Basketball Court',
  'Belly Dance',
  'Bhangra',
  'Billiards Table',
  'Bollywood',
  'Bowling',
  'Box Cricket',
  'Boxing',
  'Brazilian Jiu-Jitsu',
  'Bungee Jumping',
  'Camping',
  'Chiropractor',
  'Coaching and Healing',
  'Cricket',
  'Cricket Ground',
  'Cricket Nets',
  'CrossFit',
  'Dance',
  'Dance Fitness',
  'Fencing',
  'Folk',
  'Football',
  'Football Turf',
  'Freestyle',
  'Functional Training',
  'Golf',
  'Gym Workout',
  'Gymnastics',
  'HipHop',
  'Hockey',
  'Hollywood',
  'Hot Air Ballooning',
  'Indian Classical',
  'Indoor Cycling',
  'Jazz',
  'Jive',
  'Judo',
  'Kalaripayattu',
  'Karate',
  'Kayaking',
  'Kickboxing',
  'Kung Fu',
  'Latin',
  'Martial Arts',
  'Massage',
  'Meditation',
  'Mixed Martial Arts',
  'Mountain Biking',
  'Mountaineering',
  'Muay Thai',
  'Nutrition',
  'Padel',
  'Padel Court',
  'Para Gliding',
  'Parkour',
  'Physiotherapy',
  'Pickleball',
  'Pickleball Court',
  'Pilates',
  'Pole Fitness',
  'Polo',
  'Pool Table',
  'Prenatal',
  'Qigong',
  'Reiki',
  'River Rafting',
  'Rock Climbing',
  'Roller Skating',
  'Rowing',
  'Rugby',
  'Rumba',
  'Sailing',
  'Salsa',
  'Scuba Diving',
  'Shooting',
  'Shooting Range',
  'Skating',
  'Skydiving',
  'Snooker Table',
  'Snorkelling',
  'Spa',
  'Street',
  'Studio Rental',
  'Surfing',
  'Swimming',
  'Swimming Pool',
  'Taekwondo',
  'Tai chi',
  'Tango',
  'Tennis',
  'Tennis Court',
  'Traditional Indian',
  'Trampoline',
  'Trekking',
  'Volleyball Court',
  'Wrestling',
  'Yoga',
  'Zip-lining',
  'Zumba',
];

const AKTVITY_TAGS: Record<string, string[]> = {
  Select: ALL_AKTVITY_TAGS,
  'Fitness Training': [
    'Select',
    'Gym Workout',
    'Personal Training',
    'CrossFit',
    'Cardio Training',
    'Strength and Conditioning',
    'Functional Training',
    'Weight Loss',
    'Weightlifting',
    'Indoor Cycling',
    'Spinning',
    'Aerial Fitness',
    'Barre',
    'Pilates',
  ],
  'Wellness Sessions': [
    'Select',
    'Yoga',
    'Meditation',
    'Sound Healing',
    'Pilates',
    'Massage',
    'Spa',
    'Acupuncture',
    'Chiropractor',
    'Coaching and Healing',
    'Physiotherapy',
    'Prenatal',
    'Qigong',
    'Reiki',
    'Tai Chi',
    'Wellness',
  ],
  'Sports Coaching': [
    'Select',
    'Badminton',
    'Basketball',
    'Cricket',
    'Football',
    'Golf',
    'Gymnastics',
    'Hockey',
    'Martial Arts',
    'Boxing',
    'Brazilian Jiu-Jitsu',
    'Judo',
    'Karate',
    'Kickboxing',
    'Kung Fu',
    'Mixed Martial Arts',
    'Muay Thai',
    'Taekwondo',
    'Pickleball',
    'Squash',
    'Swimming',
    'Table Tennis',
    'Tennis',
    'Volleyball',
  ],
  'Book a Venue': [
    'Select',
    'Badminton Court',
    'Basketball Court',
    'Billiards Table',
    'Box Cricket',
    'Cricket Ground',
    'Cricket Nets',
    'Football Turf',
    'Padel Court',
    'Pickleball Court',
    'Pool Table',
    'Snooker Table',
    'Squash Court',
    'Swimming Pool',
    'Table Tennis Table',
    'Tennis Court',
    'Volleyball Court',
  ],
  'Adventure Programs': [
    'Select',
    'Bungee Jumping',
    'Camping',
    'Hot Air Ballooning',
    'Kayaking',
    'Mountain Biking',
    'Mountaineering',
    'Para Gliding',
    'Parkour',
    'River Rafting',
    'Rock Climbing',
    'Roller Skating',
    'Rowing',
    'Running',
    'Sailing',
    'Scuba Diving',
    'Skateboarding',
    'Skiing',
    'Surfing',
    'Trekking',
    'Triathlon',
    'Windsurfing',
    'Zipline',
  ],
  Dance: [
    'Select',
    'B-Boying',
    'Ballet',
    'Ballroom',
    'Belly Dance',
    'Bhangra',
    'Bollywood',
    'Dance',
    'Dance Fitness',
    'Folk',
    'Freestyle',
    'HipHop',
    'Hollywood',
    'Indian Classical',
    'Jazz',
    'Jive',
    'Latin',
    'Pole Fitness',
    'Salsa',
    'Zumba',
  ],
  Pickleball: [
    'Select',
    'Pickleball',
    'Pickleball Court',
  ],
};

export const AddServicePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { createService, updateService, getServiceById } = useServices();
  const { showToast } = useToast();

  const [categoryType, setCategoryType] = useState<'brand' | 'aktvity' | ''>('');
  const [category, setCategory] = useState<string>('Select');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [activityTag, setActivityTag] = useState<string>('Select');
  const [isCustomActivity, setIsCustomActivity] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>('');
  const [sacCode, setSacCode] = useState<string>('');
  const [tax, setTax] = useState<string>('Select');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      setLoadingInitial(true);
      getServiceById(id).then((res) => {
        setLoadingInitial(false);
        if (res.success && res.data) {
          setCategoryType(res.data.categoryType || '');
          setSacCode(res.data.sacCode || '');
          setTax(res.data.tax ? String(res.data.tax) : 'Select');
          if (res.data.name) {
            setCustomName(res.data.name);
            setSelectedActivities([res.data.name]);
            setIsCustomActivity(true);
            setActivityTag(res.data.name);
          }
        }
      });
    }
  }, [id]);

  const toggleActivity = (activity: string) => {
    setSelectedActivities((prev) =>
      prev.includes(activity) ? prev.filter((a) => a !== activity) : [...prev, activity]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryType) {
      showToast('Please select a Category Type', 'error');
      return;
    }
    if ((categoryType === 'brand' || categoryType === 'aktvity') && !category) {
      showToast('Please select a Category', 'error');
      return;
    }

    // Determine final service name(s)
    let finalNames: string[] = [];

    if (categoryType === 'aktvity') {
      if (activityTag === 'Select' && !customName.trim()) {
        showToast('Please select a Service / Activity Tag', 'error');
        return;
      }
      finalNames = [activityTag !== 'Select' ? activityTag : customName.trim()];
    } else if (categoryType === 'brand') {
      if (selectedActivities.length > 0) {
        finalNames = [...selectedActivities];
      }
      if (customName.trim() && !finalNames.includes(customName.trim())) {
        finalNames.push(customName.trim());
      }
      if (finalNames.length === 0) {
        showToast('Please select at least one activity or enter a name', 'error');
        return;
      }
    }

    // Navigate immediately before API call so UI is never blocked
    navigate('/admin/services');

    // Fire API in background
    try {
      if (id) {
        const payload = {
          name: finalNames[0],
          categoryType: categoryType || 'brand',
          sacCode: sacCode.trim(),
          tax: tax === 'Select' ? 'No tax' : tax,
        };
        const res = await updateService(id, payload);
        if (res.success) {
          showToast('Service updated successfully', 'success');
        } else {
          showToast(res.message || 'Failed to update service', 'error');
        }
      } else {
        let allSuccess = true;
        for (const actName of finalNames) {
          const payload = {
            name: actName,
            categoryType: categoryType || 'brand',
            sacCode: sacCode.trim(),
            tax: tax === 'Select' ? 'No tax' : tax,
          };
          const res = await createService(payload);
          if (!res.success) {
            allSuccess = false;
            showToast(res.message || `Failed to add ${actName}`, 'error');
            break;
          }
        }
        if (allSuccess) {
          showToast(
            finalNames.length > 1
              ? `${finalNames.length} services added successfully`
              : 'Service added successfully',
            'success'
          );
        }
      }
    } catch (err: any) {
      console.error('handleSubmit error:', err);
      showToast(err?.message || 'Something went wrong', 'error');
    }
  };


  const categoriesList = categoryType === 'aktvity' ? AKTVITY_CATEGORIES : BRAND_CATEGORIES;
  const currentCheckboxActivities = CATEGORY_CHECKBOX_ACTIVITIES[category] || [];
  const currentAktvityTags = AKTVITY_TAGS[category] || AKTVITY_TAGS['Select'];

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 p-4 sm:p-6 space-y-6">
      
      {/* Breadcrumb Navigation */}
      <div className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 gap-2">
        <Link to="/admin/dashboard" className="hover:text-gray-700 dark:hover:text-gray-200">
          Home
        </Link>
        <span>/</span>
        {categoryType !== 'aktvity' && (
          <>
            <span>Setup</span>
            <span>/</span>
            <span>General</span>
            <span>/</span>
          </>
        )}
        <span className="text-[#ff5e28] font-semibold">
          {id ? 'Edit Service' : 'Add Service'}
        </span>
      </div>

      {/* Main Form Container */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
        {loadingInitial ? (
          <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Loading service details...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 max-w-5xl text-sm">
            
            {/* 1. Category Type Radio Options */}
            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-start gap-4">
              <label className="text-sm font-medium text-gray-800 dark:text-gray-200 pt-0.5">
                Category Type <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2.5">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="categoryType"
                    value="brand"
                    checked={categoryType === 'brand'}
                    onChange={() => {
                      setCategoryType('brand');
                      setCategory('Fitness'); // auto-select first real category
                      setActivityTag('Select');
                      setSelectedActivities([]);
                      setIsCustomActivity(false);
                    }}
                    className="mt-0.5 w-4 h-4 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    <span className="font-semibold text-gray-900 dark:text-white">Brand:</span> You will be able to sell this service at the studio, company's website, member mobile app and plug-in.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="categoryType"
                    value="aktvity"
                    checked={categoryType === 'aktvity'}
                    onChange={() => {
                      setCategoryType('aktvity');
                      setCategory('Fitness Training'); // auto-select first real aktvity category
                      setActivityTag('Select');
                      setSelectedActivities([]);
                      setIsCustomActivity(false);
                    }}
                    className="mt-0.5 w-4 h-4 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    <span className="font-semibold text-gray-900 dark:text-white">aktvity:</span> You will be able to sell this service on SoActiv website and SoActiv app.
                  </span>
                </label>
              </div>
            </div>

            {/* 2. Category Dropdown (Shown when Brand OR aktvity is selected) */}
            {(categoryType === 'brand' || categoryType === 'aktvity') && (
              <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-center gap-4">
                <label className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Category<span className="text-red-500">*</span>
                </label>
                <div>
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setActivityTag('Select');
                      setSelectedActivities([]);
                    }}
                    className="w-full max-w-[200px] px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500 text-sm"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* 3A. In Brand mode: Service / Activity Name Checkboxes or Input */}
            {categoryType === 'brand' && (
              <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-start gap-4">
                <label className="text-sm font-medium text-gray-800 dark:text-gray-200 pt-0.5">
                  <div>Service / Actvity</div>
                  <div>Name <span className="text-red-500">*</span></div>
                </label>
                <div className="space-y-3">
                  {/* If category has checkboxes */}
                  {category !== 'Select' && currentCheckboxActivities.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-5 gap-y-2.5">
                      {currentCheckboxActivities.map((act) => (
                        <label
                          key={act}
                          className="flex items-center gap-2 cursor-pointer select-none text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200"
                        >
                          <input
                            type="checkbox"
                            checked={selectedActivities.includes(act)}
                            onChange={() => toggleActivity(act)}
                            className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                          />
                          <span>{act}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Custom Name Input if requested */}
                  {isCustomActivity && (
                    <div className="pt-2">
                      <input
                        type="text"
                        placeholder="Enter custom service / activity name"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="w-full max-w-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500 text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3B. In Brand mode: Can't find your activities? */}
            {categoryType === 'brand' && (
              <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-center gap-4">
                <label className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Can't find your activities?
                </label>
                <div>
                  <button
                    type="button"
                    onClick={() => setIsCustomActivity((prev) => !prev)}
                    className="px-4 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md shadow-xs transition-colors cursor-pointer"
                  >
                    Create Your Own Activity
                  </button>
                </div>
              </div>
            )}

            {/* 3C. In aktvity mode: Service / Activity Tag dropdown */}
            {categoryType === 'aktvity' && (
              <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-center gap-4">
                <label className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  <div>Service / Actvity</div>
                  <div>Tag</div>
                </label>
                <div className="flex items-center gap-1">
                  <select
                    value={activityTag}
                    onChange={(e) => {
                      setActivityTag(e.target.value);
                      setCustomName(e.target.value !== 'Select' ? e.target.value : '');
                    }}
                    className="w-full max-w-[200px] px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500 text-sm"
                  >
                    {currentAktvityTags.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                  <span className="text-red-500 font-bold text-sm">*</span>
                </div>
              </div>
            )}

            {/* 4. When unselected (no category type chosen) */}
            {categoryType === '' && (
              <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-start gap-4">
                <label className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  <div>Service / Actvity</div>
                  <div>Name <span className="text-red-500">*</span></div>
                </label>
                <div></div>
              </div>
            )}

            {/* 5. SAC Code */}
            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-center gap-4">
              <label className="text-sm font-medium text-gray-800 dark:text-gray-200">
                SAC Code
              </label>
              <div>
                <input
                  type="text"
                  placeholder=""
                  value={sacCode}
                  onChange={(e) => setSacCode(e.target.value)}
                  className="w-full max-w-[200px] px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500 text-sm"
                />
              </div>
            </div>

            {/* 6. Tax */}
            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-center gap-4">
              <label className="text-sm font-medium text-gray-800 dark:text-gray-200">
                Tax
              </label>
              <div>
                <select
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                  className="w-full max-w-[200px] px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500 text-sm"
                >
                  <option value="Select">Select</option>
                  <option value="No tax">No tax</option>
                  <option value="GST 5%">GST 5%</option>
                  <option value="GST 12%">GST 12%</option>
                  <option value="GST 18%">GST 18%</option>
                  <option value="GST 28%">GST 28%</option>
                </select>
              </div>
            </div>

            {/* 7. Save Button */}
            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4 pt-2">
              <div className="hidden sm:block"></div>
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-2 text-sm font-semibold text-white bg-[#ff5e28] hover:bg-[#ea4f1b] disabled:opacity-50 rounded shadow-xs transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>

          </form>
        )}
      </div>

    </div>
  );
};

export default AddServicePage;
