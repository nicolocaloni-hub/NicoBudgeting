import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GlobalVar, Fringe, Category, BudgetLine, Account, ArchiveEntry } from './types';
import Sidebar from './components/Sidebar';
import BudgetTable from './components/BudgetTable';
import { recalculateBudget, parseCurrency } from './utils/calculations';
import { exportBudgetPdf } from './utils/exportBudgetPdf';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const ARCHIVE_KEY = 'nicobudget_archive_v1';
const CURRENT_PROJECT_KEY = 'nicobudget_current_v1';

const INITIAL_GLOBALS: GlobalVar[] = [
  { id: 'g1', name: 'SETTIMANE_RIPRESE', value: 8, description: 'Settimane totali' },
];

const createLine = (description: string): BudgetLine => ({
  id: 'l-' + Math.random().toString(36).substr(2, 9),
  description: description,
  amount: '1', 
  multiplierX: '1',
  rate: '0',
  unit: 'UNIT',
  fringeIds: [],
  total: 0
});

const getInitialCategories = (): Category[] => [
  {
    id: 'cat-1000', code: '1000', name: 'Soggetto e Diritti', total: 0,
    accounts: [
      { id: 'acc-1001', code: '1001', name: 'Compensi Sceneggiatura', total: 0, lines: [createLine('Sceneggiatura')] },
      { id: 'acc-1002', code: '1002', name: 'Diritti Storia / Opzioni', total: 0, lines: [createLine('Diritti')] },
      { id: 'acc-1003', code: '1003', name: 'Deposito Siae / Script', total: 0, lines: [createLine('Deposito')] },
      { id: 'acc-1010', code: '1010', name: 'Cancelleria e Forniture', total: 0, lines: [createLine('Forniture')] },
    ]
  },
  {
    id: 'cat-1100', code: '1100', name: 'Produttori', total: 0,
    accounts: [
      { id: 'acc-1101', code: '1101', name: 'Produttore Esecutivo', total: 0, lines: [createLine('Prod. Esecutivo')] },
      { id: 'acc-1102', code: '1102', name: 'Produttore Associato', total: 0, lines: [createLine('Prod. Associato')] },
      { id: 'acc-1130', code: '1130', name: 'Spese Varie Produzione', total: 0, lines: [createLine('Spese Varie')] },
    ]
  },
  {
    id: 'cat-1200', code: '1200', name: 'Regia', total: 0,
    accounts: [
      { id: 'acc-1201', code: '1201', name: 'Regista 1^ Unità', total: 0, lines: [createLine('Regista')] },
      { id: 'acc-1202', code: '1202', name: 'Regista 2^ Unità', total: 0, lines: [createLine('Aiuto Regia 2^ Unità')] },
      { id: 'acc-1230', code: '1230', name: 'Spese Varie Regia', total: 0, lines: [createLine('Spese Varie')] },
    ]
  },
  {
    id: 'cat-1300', code: '1300', name: 'Cast', total: 0,
    accounts: [
      { id: 'acc-1301', code: '1301', name: 'Attori Protagonisti', total: 0, lines: [createLine('Protagonisti')] },
      { id: 'acc-1302', code: '1302', name: 'Attori Secondari', total: 0, lines: [createLine('Secondari')] },
      { id: 'acc-1303', code: '1303', name: 'Coordinatore Stunt', total: 0, lines: [createLine('Coord. Stunt')] },
      { id: 'acc-1304', code: '1304', name: 'Stuntman', total: 0, lines: [createLine('Stuntman')] },
      { id: 'acc-1307', code: '1307', name: 'Doppiaggio Cast', total: 0, lines: [createLine('Looping')] },
    ]
  },
  {
    id: 'cat-1500', code: '1500', name: 'Comparse e Figurazioni', total: 0,
    accounts: [
      { id: 'acc-1501', code: '1501', name: 'Stand-in / Controfigure', total: 0, lines: [createLine('Stand-in')] },
      { id: 'acc-1502', code: '1502', name: 'Comparse Generiche', total: 0, lines: [createLine('Background')] },
      { id: 'acc-1512', code: '1512', name: 'Straordinari / Diaria', total: 0, lines: [createLine('Overtime')] },
    ]
  },
  {
    id: 'cat-1600', code: '1600', name: 'Staff di Produzione', total: 0,
    accounts: [
      { id: 'acc-1601', code: '1601', name: 'Unit Production Manager', total: 0, lines: [createLine('UPM')] },
      { id: 'acc-1602', code: '1602', name: '1st Assistant Director', total: 0, lines: [createLine('1st AD')] },
      { id: 'acc-1603', code: '1603', name: '2nd Assistant Director', total: 0, lines: [createLine('2nd AD')] },
      { id: 'acc-1604', code: '1604', name: 'Production Coordinator', total: 0, lines: [createLine('Prod Coordinator')] },
      { id: 'acc-1605', code: '1605', name: 'Script Supervisor', total: 0, lines: [createLine('Script Supervisor')] },
      { id: 'acc-1606', code: '1606', name: 'Location Manager', total: 0, lines: [createLine('Location Manager')] },
      { id: 'acc-1607', code: '1607', name: 'Production Assistants', total: 0, lines: [createLine('PAs')] },
      { id: 'acc-1608', code: '1608', name: 'Teacher-Welfare Worker', total: 0, lines: [createLine('Teacher')] },
      { id: 'acc-1610', code: '1610', name: 'Supplies', total: 0, lines: [createLine('Supplies')] },
      { id: 'acc-1611', code: '1611', name: 'Purchases', total: 0, lines: [createLine('Purchases')] },
      { id: 'acc-1613', code: '1613', name: 'Rentals', total: 0, lines: [createLine('Rentals')] },
      { id: 'acc-1630', code: '1630', name: 'Miscellaneous Expenses', total: 0, lines: [createLine('Misc')] },
    ]
  },
  {
    id: 'cat-1700', code: '1700', name: 'Pellicola e Laboratorio', total: 0,
    accounts: [
      { id: 'acc-1701', code: '1701', name: 'Raw Film Stock', total: 0, lines: [createLine('Raw Stock')] },
      { id: 'acc-1702', code: '1702', name: 'Negative Developing', total: 0, lines: [createLine('Neg Dev')] },
      { id: 'acc-1703', code: '1703', name: 'Positive Prints', total: 0, lines: [createLine('Prints')] },
      { id: 'acc-1704', code: '1704', name: '1/4" Tape', total: 0, lines: [createLine('Tape')] },
      { id: 'acc-1705', code: '1705', name: 'Sound Transfer', total: 0, lines: [createLine('Sound Transfer')] },
      { id: 'acc-1706', code: '1706', name: 'Telecine Transfer', total: 0, lines: [createLine('Telecine')] },
      { id: 'acc-1707', code: '1707', name: 'Poloroid Film', total: 0, lines: [createLine('Polaroid')] },
      { id: 'acc-1730', code: '1730', name: 'Miscellaneous Expense', total: 0, lines: [createLine('Misc')] },
    ]
  },
  {
    id: 'cat-1800', code: '1800', name: 'Camera', total: 0,
    accounts: [
      { id: 'acc-1801', code: '1801', name: 'Director of Photography', total: 0, lines: [createLine('DOP')] },
      { id: 'acc-1802', code: '1802', name: 'Camera Operator', total: 0, lines: [createLine('Operator')] },
      { id: 'acc-1803', code: '1803', name: '1st Asst. Cameraman', total: 0, lines: [createLine('1st AC')] },
      { id: 'acc-1804', code: '1804', name: '2nd Asst. Cameraman', total: 0, lines: [createLine('2nd AC')] },
      { id: 'acc-1805', code: '1805', name: 'Still Photographer', total: 0, lines: [createLine('Still Photog')] },
      { id: 'acc-1811', code: '1811', name: 'Purchases', total: 0, lines: [createLine('Purchases')] },
      { id: 'acc-1813', code: '1813', name: 'Rentals', total: 0, lines: [createLine('Rentals')] },
      { id: 'acc-1814', code: '1814', name: 'Loss, Damage, & Repair', total: 0, lines: [createLine('L&D')] },
      { id: 'acc-1830', code: '1830', name: 'Miscellaneous Expenses', total: 0, lines: [createLine('Misc')] },
    ]
  },
  {
    id: 'cat-1900', code: '1900', name: 'Costumi', total: 0,
    accounts: [
      { id: 'acc-1901', code: '1901', name: 'Designers', total: 0, lines: [createLine('Designer')] },
      { id: 'acc-1902', code: '1902', name: 'Lead Costumers', total: 0, lines: [createLine('Lead Costumer')] },
      { id: 'acc-1910', code: '1910', name: 'Materials/Supplies', total: 0, lines: [createLine('Materials')] },
      { id: 'acc-1911', code: '1911', name: 'Purchases', total: 0, lines: [createLine('Purchases')] },
      { id: 'acc-1913', code: '1913', name: 'Rentals', total: 0, lines: [createLine('Rentals')] },
      { id: 'acc-1914', code: '1914', name: 'Loss & Damage', total: 0, lines: [createLine('L&D')] },
      { id: 'acc-1930', code: '1930', name: 'Miscellaneous Expense', total: 0, lines: [createLine('Misc')] },
    ]
  },
  {
    id: 'cat-2000', code: '2000', name: 'Trucco e Parrucco', total: 0,
    accounts: [
      { id: 'acc-2001', code: '2001', name: 'Key Makeup Artist', total: 0, lines: [createLine('Key Makeup')] },
      { id: 'acc-2002', code: '2002', name: 'Head Hair Stylist', total: 0, lines: [createLine('Head Hair')] },
      { id: 'acc-2003', code: '2003', name: 'SPFX Makeup', total: 0, lines: [createLine('SPFX Makeup')] },
      { id: 'acc-2011', code: '2011', name: 'Purchases', total: 0, lines: [createLine('Purchases')] },
      { id: 'acc-2013', code: '2013', name: 'Rentals', total: 0, lines: [createLine('Rentals')] },
      { id: 'acc-2014', code: '2014', name: 'Loss and Damages', total: 0, lines: [createLine('L&D')] },
      { id: 'acc-2030', code: '2030', name: 'Miscellaneous Expenses', total: 0, lines: [createLine('Misc')] },
    ]
  },
  {
    id: 'cat-2100', code: '2100', name: 'Arredamento', total: 0,
    accounts: [
      { id: 'acc-2101', code: '2101', name: 'Set Decorator', total: 0, lines: [createLine('Set Decorator')] },
      { id: 'acc-2102', code: '2102', name: 'On-set Dresser', total: 0, lines: [createLine('On-set Dresser')] },
      { id: 'acc-2111', code: '2111', name: 'Purchases', total: 0, lines: [createLine('Purchases')] },
      { id: 'acc-2113', code: '2113', name: 'Rentals', total: 0, lines: [createLine('Rentals')] },
      { id: 'acc-2114', code: '2114', name: 'Loss & Damage', total: 0, lines: [createLine('L&D')] },
      { id: 'acc-2130', code: '2130', name: 'Miscellaneous Expense', total: 0, lines: [createLine('Misc')] },
    ]
  },
  {
    id: 'cat-2200', code: '2200', name: 'Attrezzeria', total: 0,
    accounts: [
      { id: 'acc-2201', code: '2201', name: 'Propmaster', total: 0, lines: [createLine('Propmaster')] },
      { id: 'acc-2202', code: '2202', name: 'Asst Propmaster', total: 0, lines: [createLine('Asst Propmaster')] },
      { id: 'acc-2203', code: '2203', name: 'Wranglers/Handlers', total: 0, lines: [createLine('Wranglers')] },
      { id: 'acc-2204', code: '2204', name: 'Animals', total: 0, lines: [createLine('Animals')] },
      { id: 'acc-2205', code: '2205', name: 'Picture Vehicles', total: 0, lines: [createLine('Picture Vehicles')] },
      { id: 'acc-2211', code: '2211', name: 'Purchases', total: 0, lines: [createLine('Purchases')] },
      { id: 'acc-2213', code: '2213', name: 'Rentals', total: 0, lines: [createLine('Rentals')] },
      { id: 'acc-2214', code: '2214', name: 'Loss & Damage', total: 0, lines: [createLine('L&D')] },
      { id: 'acc-2230', code: '2230', name: 'Miscellaneous Expenses', total: 0, lines: [createLine('Misc')] },
    ]
  },
  {
    id: 'cat-2300', code: '2300', name: 'Art Department', total: 0,
    accounts: [
      { id: 'acc-2301', code: '2301', name: 'Production Designer', total: 0, lines: [createLine('Production Designer')] },
      { id: 'acc-2302', code: '2302', name: 'Art Director', total: 0, lines: [createLine('Art Director')] },
      { id: 'acc-2303', code: '2303', name: 'Set Designers', total: 0, lines: [createLine('Set Designers')] },
      { id: 'acc-2304', code: '2304', name: 'Production Assistants', total: 0, lines: [createLine('Art PAs')] },
      { id: 'acc-2311', code: '2311', name: 'Purchases', total: 0, lines: [createLine('Purchases')] },
      { id: 'acc-2313', code: '2313', name: 'Art Department Rentals', total: 0, lines: [createLine('Rentals')] },
      { id: 'acc-2330', code: '2330', name: 'Miscellaneous Expenses', total: 0, lines: [createLine('Misc')] },
    ]
  },
  {
    id: 'cat-2400', code: '2400', name: 'Costruzione Scene', total: 0,
    accounts: [
      { id: 'acc-2401', code: '2401', name: 'Construction Coordinator', total: 0, lines: [createLine('Const Coord')] },
      { id: 'acc-2402', code: '2402', name: 'Construction Labor', total: 0, lines: [createLine('Labor')] },
      { id: 'acc-2403', code: '2403', name: 'Strike & Restorations', total: 0, lines: [createLine('Strike')] },
      { id: 'acc-2404', code: '2404', name: 'Trash Removal', total: 0, lines: [createLine('Trash Removal')] },
      { id: 'acc-2410', code: '2410', name: 'Materials & Supplies', total: 0, lines: [createLine('Materials')] },
      { id: 'acc-2413', code: '2413', name: 'Equipment Rentals', total: 0, lines: [createLine('Equip Rentals')] },
      { id: 'acc-2414', code: '2414', name: 'Loss & Damages', total: 0, lines: [createLine('L&D')] },
      { id: 'acc-2430', code: '2430', name: 'Misc. Expenses', total: 0, lines: [createLine('Misc')] },
    ]
  },
  {
    id: 'cat-2500', code: '2500', name: 'Video', total: 0,
    accounts: [
      { id: 'acc-2501', code: '2501', name: 'Supervisor', total: 0, lines: [createLine('Video Sup')] },
      { id: 'acc-2502', code: '2502', name: 'Video Operator', total: 0, lines: [createLine('Video Op')] },
      { id: 'acc-2503', code: '2503', name: 'Additional Labor', total: 0, lines: [createLine('Addl Labor')] },
      { id: 'acc-2504', code: '2504', name: 'Video Editing', total: 0, lines: [createLine('Editing')] },
      { id: 'acc-2505', code: '2505', name: 'Video Transfers', total: 0, lines: [createLine('Transfers')] },
      { id: 'acc-2506', code: '2506', name: 'Video Contracts', total: 0, lines: [createLine('Contracts')] },
      { id: 'acc-2511', code: '2511', name: 'Purchases', total: 0, lines: [createLine('Purchases')] },
      { id: 'acc-2513', code: '2513', name: 'Rentals', total: 0, lines: [createLine('Rentals')] },
      { id: 'acc-2514', code: '2514', name: 'Loss & Damages', total: 0, lines: [createLine('L&D')] },
      { id: 'acc-2530', code: '2530', name: 'Miscellaneous', total: 0, lines: [createLine('Misc')] },
    ]
  },
  {
    id: 'cat-2600', code: '2600', name: 'Registrazione Suono', total: 0,
    accounts: [
      { id: 'acc-2601', code: '2601', name: 'Production Mixer', total: 0, lines: [createLine('Mixer')] },
      { id: 'acc-2602', code: '2602', name: 'Boom Operator', total: 0, lines: [createLine('Boom')] },
      { id: 'acc-2603', code: '2603', name: 'Audio Playback', total: 0, lines: [createLine('Playback')] },
      { id: 'acc-2604', code: '2604', name: 'Walkie Talkies', total: 0, lines: [createLine('Walkies')] },
      { id: 'acc-2610', code: '2610', name: 'Sound Equip Supplies', total: 0, lines: [createLine('Supplies')] },
      { id: 'acc-2611', code: '2611', name: 'Sound Equip Purchases', total: 0, lines: [createLine('Purchases')] },
      { id: 'acc-2613', code: '2613', name: 'Sound Equip Rentals', total: 0, lines: [createLine('Rentals')] },
      { id: 'acc-2614', code: '2614', name: 'Loss & Damage', total: 0, lines: [createLine('L&D')] },
      { id: 'acc-2630', code: '2630', name: 'Miscellaneous Expenses', total: 0, lines: [createLine('Misc')] },
    ]
  },
  {
    id: 'cat-2700', code: '2700', name: 'Elettricisti / Luci', total: 0,
    accounts: [
      { id: 'acc-2701', code: '2701', name: 'Gaffer', total: 0, lines: [createLine('Gaffer')] },
      { id: 'acc-2702', code: '2702', name: 'Best Boy', total: 0, lines: [createLine('Best Boy')] },
      { id: 'acc-2703', code: '2703', name: 'Generator Operators', total: 0, lines: [createLine('Genny Op')] },
      { id: 'acc-2704', code: '2704', name: 'Rig/Strike Labor', total: 0, lines: [createLine('Labor')] },
      { id: 'acc-2705', code: '2705', name: 'Globes & Carbons', total: 0, lines: [createLine('Globes')] },
      { id: 'acc-2711', code: '2711', name: 'Purchases', total: 0, lines: [createLine('Purchases')] },
      { id: 'acc-2713', code: '2713', name: 'Rentals', total: 0, lines: [createLine('Rentals')] },
      { id: 'acc-2714', code: '2714', name: 'Loss & Damages', total: 0, lines: [createLine('L&D')] },
      { id: 'acc-2730', code: '2730', name: 'Miscellaneous Expenses', total: 0, lines: [createLine('Misc')] },
    ]
  },
  {
    id: 'cat-2800', code: '2800', name: 'Macchinisti / Grip', total: 0,
    accounts: [
      { id: 'acc-2801', code: '2801', name: 'Key Grip', total: 0, lines: [createLine('Key Grip')] },
      { id: 'acc-2802', code: '2802', name: 'Best Boy', total: 0, lines: [createLine('Best Boy')] },
      { id: 'acc-2803', code: '2803', name: 'Dolly Grip / Crane Grip', total: 0, lines: [createLine('Dolly/Crane Grip')] },
      { id: 'acc-2804', code: '2804', name: 'Rig/Strike Labor', total: 0, lines: [createLine('Labor')] },
      { id: 'acc-2805', code: '2805', name: 'Craft Service', total: 0, lines: [createLine('Craft Service')] },
      { id: 'acc-2806', code: '2806', name: 'Craft Service Supplies', total: 0, lines: [createLine('Supplies')] },
      { id: 'acc-2807', code: '2807', name: 'Dolly Rentals', total: 0, lines: [createLine('Dolly Rental')] },
      { id: 'acc-2808', code: '2808', name: 'Crane Rentals', total: 0, lines: [createLine('Crane Rental')] },
      { id: 'acc-2809', code: '2809', name: 'First Aid', total: 0, lines: [createLine('First Aid')] },
      { id: 'acc-2810', code: '2810', name: 'Materials & Supplies', total: 0, lines: [createLine('Materials')] },
      { id: 'acc-2811', code: '2811', name: 'Purchases', total: 0, lines: [createLine('Purchases')] },
      { id: 'acc-2813', code: '2813', name: 'Rentals', total: 0, lines: [createLine('Rentals')] },
      { id: 'acc-2814', code: '2814', name: 'Loss & Damage', total: 0, lines: [createLine('L&D')] },
      { id: 'acc-2830', code: '2830', name: 'Miscellaneous Expenses', total: 0, lines: [createLine('Misc')] },
    ]
  },
  {
    id: 'cat-2900', code: '2900', name: 'Strutture / Facilities', total: 0,
    accounts: [
      { id: 'acc-2901', code: '2901', name: 'Producers Office', total: 0, lines: [createLine('Prod Office')] },
      { id: 'acc-2902', code: '2902', name: 'Production Office', total: 0, lines: [createLine('Office')] },
      { id: 'acc-2903', code: '2903', name: 'Directors Office', total: 0, lines: [createLine('Dir Office')] },
      { id: 'acc-2904', code: '2904', name: 'Stage #1', total: 0, lines: [createLine('Stage 1')] },
      { id: 'acc-2905', code: '2905', name: 'Stage #2', total: 0, lines: [createLine('Stage 2')] },
      { id: 'acc-2906', code: '2906', name: 'Storage', total: 0, lines: [createLine('Storage')] },
    ]
  },
  {
    id: 'cat-3000', code: '3000', name: 'Effetti Speciali / SFX', total: 0,
    accounts: [
      { id: 'acc-3001', code: '3001', name: 'Special Effects Foreman', total: 0, lines: [createLine('Foreman')] },
      { id: 'acc-3002', code: '3002', name: 'Special Effects Technician', total: 0, lines: [createLine('Technician')] },
      { id: 'acc-3003', code: '3003', name: 'Labor', total: 0, lines: [createLine('Labor')] },
      { id: 'acc-3010', code: '3010', name: 'Supplies', total: 0, lines: [createLine('Supplies')] },
      { id: 'acc-3011', code: '3011', name: 'Purchases', total: 0, lines: [createLine('Purchases')] },
      { id: 'acc-3013', code: '3013', name: 'Rentals', total: 0, lines: [createLine('Rentals')] },
      { id: 'acc-3030', code: '3030', name: 'Miscellaneous Expenses', total: 0, lines: [createLine('Misc')] },
    ]
  },
  {
    id: 'cat-3100', code: '3100', name: 'Location', total: 0,
    accounts: [
      { id: 'acc-3101', code: '3101', name: 'Site Rentals, Fees, & Permits', total: 0, lines: [createLine('Rentals/Permits')] },
      { id: 'acc-3102', code: '3102', name: 'Fireman/Police/Watchmen', total: 0, lines: [createLine('Security')] },
      { id: 'acc-3103', code: '3103', name: 'Scouting Expenses', total: 0, lines: [createLine('Scouting')] },
      { id: 'acc-3104', code: '3104', name: 'First Aid & Medical Services', total: 0, lines: [createLine('Medical')] },
      { id: 'acc-3105', code: '3105', name: 'Location Employees', total: 0, lines: [createLine('Employees')] },
      { id: 'acc-3106', code: '3106', name: 'Catered Meals', total: 0, lines: [createLine('Meals')] },
      { id: 'acc-3107', code: '3107', name: 'Catering Staff', total: 0, lines: [createLine('Staff')] },
      { id: 'acc-3108', code: '3108', name: 'Location Parking', total: 0, lines: [createLine('Parking')] },
      { id: 'acc-3109', code: '3109', name: 'Shipping & Forwarding Costs', total: 0, lines: [createLine('Shipping')] },
      { id: 'acc-3110', code: '3110', name: 'Special Equipment', total: 0, lines: [createLine('Special Equip')] },
      { id: 'acc-3111', code: '3111', name: 'Purchases', total: 0, lines: [createLine('Purchases')] },
      { id: 'acc-3113', code: '3113', name: 'Rentals', total: 0, lines: [createLine('Rentals')] },
      { id: 'acc-3114', code: '3114', name: 'Loss & Damages', total: 0, lines: [createLine('L&D')] },
      { id: 'acc-3130', code: '3130', name: 'Miscellaneous Expenses', total: 0, lines: [createLine('Misc')] },
    ]
  },
  {
    id: 'cat-3200', code: '3200', name: 'Trasporti', total: 0,
    accounts: [
      { id: 'acc-3201', code: '3201', name: 'Coordinator', total: 0, lines: [createLine('Coord')] },
      { id: 'acc-3202', code: '3202', name: 'Trans Captin', total: 0, lines: [createLine('Capt')] },
      { id: 'acc-3203', code: '3203', name: 'Location Drivers', total: 0, lines: [createLine('Drivers')] },
      { id: 'acc-3204', code: '3204', name: 'Truck Rental', total: 0, lines: [createLine('Truck Rental')] },
      { id: 'acc-3205', code: '3205', name: 'Dressing Room Rental', total: 0, lines: [createLine('Dressing Room')] },
      { id: 'acc-3206', code: '3206', name: 'Location Equipment', total: 0, lines: [createLine('Loc Equip')] },
      { id: 'acc-3207', code: '3207', name: 'Gas, Oil & Vehicle Washes', total: 0, lines: [createLine('Gas/Oil')] },
      { id: 'acc-3208', code: '3208', name: 'Repairs & Maintenance', total: 0, lines: [createLine('Repairs')] },
      { id: 'acc-3209', code: '3209', name: 'Self-Drivers', total: 0, lines: [createLine('Self-Drivers')] },
      { id: 'acc-3313-v2', code: '3213', name: 'Rentals', total: 0, lines: [createLine('Rentals')] },
      { id: 'acc-3314-v2', code: '3214', name: 'Loss & Damages', total: 0, lines: [createLine('L&D')] },
      { id: 'acc-3330-v2', code: '3230', name: 'Miscellaneous Expenses', total: 0, lines: [createLine('Misc')] },
    ]
  },
  {
    id: 'cat-3300', code: '3300', name: 'Second Unit', total: 0,
    accounts: [
      { id: 'acc-3301', code: '3301', name: 'Producer', total: 0, lines: [createLine('Producer')] },
      { id: 'acc-3302', code: '3302', name: 'Director', total: 0, lines: [createLine('Director')] },
      { id: 'acc-3303', code: '3303', name: 'Cast', total: 0, lines: [createLine('Cast')] },
      { id: 'acc-3304', code: '3304', name: 'Bits & Stunts', total: 0, lines: [createLine('Stunts')] },
      { id: 'acc-3305', code: '3305', name: 'Extras', total: 0, lines: [createLine('Extras')] },
      { id: 'acc-3306', code: '3306', name: 'Travel/Expenses', total: 0, lines: [createLine('Travel')] },
      { id: 'acc-3307', code: '3307', name: 'Production Staff', total: 0, lines: [createLine('Staff')] },
      { id: 'acc-3308', code: '3308', name: 'Makeup & Hair', total: 0, lines: [createLine('Makeup')] },
      { id: 'acc-3309', code: '3309', name: 'Camera', total: 0, lines: [createLine('Camera')] },
      { id: 'acc-3314', code: '3314', name: 'Loss & Damage', total: 0, lines: [createLine('L&D')] },
      { id: 'acc-3315', code: '3315', name: 'Film/Lab', total: 0, lines: [createLine('Film/Lab')] },
      { id: 'acc-3316', code: '3316', name: 'Set Construction/Design', total: 0, lines: [createLine('Set')] },
      { id: 'acc-3317', code: '3317', name: 'Set Lighting', total: 0, lines: [createLine('Lighting')] },
      { id: 'acc-3318', code: '3318', name: 'Sound', total: 0, lines: [createLine('Sound')] },
      { id: 'acc-3319', code: '3319', name: 'Locations', total: 0, lines: [createLine('Locations')] },
      { id: 'acc-3320', code: '3320', name: 'Transportation', total: 0, lines: [createLine('Trans')] },
      { id: 'acc-3330', code: '3330', name: 'Miscellaneous', total: 0, lines: [createLine('Misc')] },
    ]
  },
  {
    id: 'cat-3400', code: '3400', name: 'Montaggio / Editing', total: 0,
    accounts: [
      { id: 'acc-3401', code: '3401', name: 'Editor', total: 0, lines: [createLine('Editor')] },
      { id: 'acc-3402', code: '3402', name: 'Assistant Editor', total: 0, lines: [createLine('Asst Editor')] },
      { id: 'acc-3411', code: '3411', name: 'Purchases', total: 0, lines: [createLine('Purchases')] },
      { id: 'acc-3413', code: '3413', name: 'Rentals', total: 0, lines: [createLine('Rentals')] },
      { id: 'acc-3430', code: '3430', name: 'Miscellaneous Expenses', total: 0, lines: [createLine('Misc')] },
    ]
  },
  {
    id: 'cat-3500', code: '3500', name: 'Musica', total: 0,
    accounts: [
      { id: 'acc-3501', code: '3501', name: 'Clearences', total: 0, lines: [createLine('Clearances')] },
      { id: 'acc-3502', code: '3502', name: 'Song Writers', total: 0, lines: [createLine('Song Writers')] },
      { id: 'acc-3503', code: '3503', name: 'Composers', total: 0, lines: [createLine('Composers')] },
      { id: 'acc-3504', code: '3504', name: 'Music Supervisor', total: 0, lines: [createLine('Supervisor')] },
      { id: 'acc-3530', code: '3530', name: 'Miscellaneous Expenses', total: 0, lines: [createLine('Misc')] },
    ]
  },
  {
    id: 'cat-3600', code: '3600', name: 'Post-Produzione Audio', total: 0,
    accounts: [
      { id: 'acc-3601', code: '3601', name: 'Dubbing Stage', total: 0, lines: [createLine('Dubbing')] },
      { id: 'acc-3602', code: '3602', name: 'ADR Stage', total: 0, lines: [createLine('ADR')] },
      { id: 'acc-3603', code: '3603', name: 'Foley and EFX Recording', total: 0, lines: [createLine('Foley')] },
      { id: 'acc-3604', code: '3604', name: 'Tape Transfers', total: 0, lines: [createLine('Transfers')] },
      { id: 'acc-3611', code: '3611', name: 'Purcahses', total: 0, lines: [createLine('Purchases')] },
      { id: 'acc-3613', code: '3613', name: 'Rentals', total: 0, lines: [createLine('Rentals')] },
      { id: 'acc-3630', code: '3630', name: 'Miscellaneous Expenses', total: 0, lines: [createLine('Misc')] },
    ]
  },
  {
    id: 'cat-3700', code: '3700', name: 'Post-Prod Film & Lab', total: 0,
    accounts: [
      { id: 'acc-3701', code: '3701', name: 'Film Leader', total: 0, lines: [createLine('Leader')] },
      { id: 'acc-3702', code: '3702', name: 'Negative Splicing', total: 0, lines: [createLine('Splicing')] },
      { id: 'acc-3703', code: '3703', name: 'Picture Reprints', total: 0, lines: [createLine('Reprints')] },
      { id: 'acc-3704', code: '3704', name: 'Stock Shots', total: 0, lines: [createLine('Stock Shots')] },
      { id: 'acc-3705', code: '3705', name: 'Opticals', total: 0, lines: [createLine('Opticals')] },
      { id: 'acc-3706', code: '3706', name: 'Video Dupes', total: 0, lines: [createLine('Dupes')] },
      { id: 'acc-3707', code: '3707', name: 'Video Cassette', total: 0, lines: [createLine('Cassette')] },
      { id: 'acc-3708', code: '3708', name: 'Video Delivery', total: 0, lines: [createLine('Delivery')] },
      { id: 'acc-3711', code: '3711', name: 'Purchases', total: 0, lines: [createLine('Purchases')] },
      { id: 'acc-3712', code: '3712', name: 'Lab Overtime', total: 0, lines: [createLine('Lab OT')] },
      { id: 'acc-3713', code: '3713', name: 'Rentals', total: 0, lines: [createLine('Rentals')] },
      { id: 'acc-3730', code: '3730', name: 'Miscellaneous Expenses', total: 0, lines: [createLine('Misc')] },
    ]
  },
  {
    id: 'cat-3800', code: '3800', name: 'Titoli e Ottiche', total: 0,
    accounts: [
      { id: 'acc-3801', code: '3801', name: 'Titles', total: 0, lines: [createLine('Titles')] },
      { id: 'acc-3802', code: '3802', name: 'Main & End Titles', total: 0, lines: [createLine('Main/End')] },
      { id: 'acc-3803', code: '3803', name: 'Optical Development', total: 0, lines: [createLine('Optical Dev')] },
      { id: 'acc-3830', code: '3830', name: 'Miscellaneous Expenses', total: 0, lines: [createLine('Misc')] },
    ]
  },
  {
    id: 'cat-3900', code: '3900', name: 'Assicurazione', total: 0,
    accounts: [
      { id: 'acc-3901', code: '3901', name: 'Cast Insurance', total: 0, lines: [createLine('Cast Ins')] },
      { id: 'acc-3902', code: '3902', name: 'Negative Insurance', total: 0, lines: [createLine('Neg Ins')] },
      { id: 'acc-3903', code: '3903', name: 'Extra Expense', total: 0, lines: [createLine('Extra Exp')] },
      { id: 'acc-3930', code: '3930', name: 'Miscellaneous Expense', total: 0, lines: [createLine('Misc')] },
    ]
  },
  {
    id: 'cat-4000', code: '4000', name: 'Pubblicità', total: 0,
    accounts: [
      { id: 'acc-4001', code: '4001', name: 'Publicist', total: 0, lines: [createLine('Publicist')] },
      { id: 'acc-4002', code: '4002', name: 'Film Festivals', total: 0, lines: [createLine('Festivals')] },
      { id: 'acc-4003', code: '4003', name: 'Marketing Materials', total: 0, lines: [createLine('Marketing')] },
      { id: 'acc-4030', code: '4030', name: 'Miscellaneous Expenses', total: 0, lines: [createLine('Misc')] },
    ]
  },
  {
    id: 'cat-4100', code: '4100', name: 'Product Placement', total: 0,
    accounts: [
      { id: 'acc-4101', code: '4101', name: 'Product 1', total: 0, lines: [createLine('Product 1')] },
      { id: 'acc-4102', code: '4102', name: 'Product 2', total: 0, lines: [createLine('Product 2')] },
    ]
  },
  {
    id: 'cat-4200', code: '4200', name: 'Spese Generali', total: 0,
    accounts: [
      { id: 'acc-4201', code: '4201', name: 'Office Supplies', total: 0, lines: [createLine('Supplies')] },
      { id: 'acc-4202', code: '4202', name: 'Local Meals', total: 0, lines: [createLine('Meals')] },
      { id: 'acc-4203', code: '4203', name: 'Photocopies', total: 0, lines: [createLine('Copies')] },
      { id: 'acc-4204', code: '4204', name: 'Office Postage & Shipping', total: 0, lines: [createLine('Postage')] },
      { id: 'acc-4205', code: '4205', name: 'Telephones', total: 0, lines: [createLine('Telephones')] },
      { id: 'acc-4206', code: '4206', name: 'Fax', total: 0, lines: [createLine('Fax')] },
      { id: 'acc-4213', code: '4213', name: 'Rentals', total: 0, lines: [createLine('Rentals')] },
      { id: 'acc-4230', code: '4230', name: 'Miscellaneous Expense', total: 0, lines: [createLine('Misc')] },
    ]
  }
];

const getInitialFringesList = (): Fringe[] => [
  { id: 'f1', name: 'Contributi Previdenziali', rate: 0.15, isAppliedByDefault: true },
  { id: 'f2', name: 'Assicurazione Sanitaria', rate: 0.05, isAppliedByDefault: true },
];

const createNewProjectState = () => {
  const freshFringes = getInitialFringesList();
  const freshCategories = getInitialCategories();
  return {
    projectId: 'prj-' + Math.random().toString(36).substr(2, 9),
    title: 'NUOVO PROGETTO',
    fringes: freshFringes,
    categories: recalculateBudget(freshCategories, INITIAL_GLOBALS, freshFringes)
  };
};

const App: React.FC = () => {
  const [projectId, setProjectId] = useState(() => 'prj-' + Math.random().toString(36).substr(2, 9));
  const [currentView, setCurrentView] = useState<'editor' | 'summary' | 'archive'>('editor');
  const [projectTitle, setProjectTitle] = useState('NUOVO PROGETTO');
  const [fringes, setFringes] = useState<Fringe[]>(getInitialFringesList());
  const [categories, setCategories] = useState<Category[]>(() => recalculateBudget(getInitialCategories(), INITIAL_GLOBALS, getInitialFringesList()));
  const [archive, setArchive] = useState<ArchiveEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
  const [newCatData, setNewCatData] = useState({ code: '', name: '' });
  const [showSaveToast, setShowSaveToast] = useState(false);

  // Available Budget (Cap) State
  const [availableBudget, setAvailableBudget] = useState<string | null>(null);
  const [isCapModalOpen, setIsCapModalOpen] = useState(false);
  const [tempCap, setTempCap] = useState('');

  // PDF Export Setup State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportHeader, setExportHeader] = useState({
    productionTitle: '',
    version: 'IN PROGRESS',
    exportDate: new Date().toISOString().split('T')[0],
    includeCover: true
  });

  const [leftInfo, setLeftInfo] = useState([
    { label: 'Start Date', value: '' },
    { label: 'Finish Date', value: '' },
    { label: 'Total Days', value: '' },
    { label: 'Co-Production', value: '' },
    { label: '', value: '' },
    { label: '', value: '' }
  ]);

  const [rightInfo, setRightInfo] = useState([
    { label: 'Producers', value: '' },
    { label: 'Director', value: '' },
    { label: '1st Assistant Director', value: '' },
    { label: 'DOP', value: '' },
    { label: 'Location', value: '' },
    { label: '', value: '' },
    { label: '', value: '' }
  ]);

  useEffect(() => {
    setExportHeader(prev => ({ ...prev, productionTitle: projectTitle }));
  }, [projectTitle]);

  // Load persistence data on mount
  useEffect(() => {
    const savedArchive = localStorage.getItem(ARCHIVE_KEY);
    if (savedArchive) {
      try { setArchive(JSON.parse(savedArchive)); } catch (e) { console.error("Error loading archive:", e); }
    }

    const savedCurrent = localStorage.getItem(CURRENT_PROJECT_KEY);
    if (savedCurrent) {
      try {
        const data = JSON.parse(savedCurrent);
        setProjectId(data.projectId);
        setProjectTitle(data.projectTitle);
        setFringes(data.fringes);
        setCategories(data.categories);
        if (data.availableBudget !== undefined) setAvailableBudget(data.availableBudget);
      } catch (e) { console.error("Error rehydrating project:", e); }
    }
  }, []);

  // Autosave current project with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      const data = { projectId, projectTitle, fringes, categories, availableBudget };
      localStorage.setItem(CURRENT_PROJECT_KEY, JSON.stringify(data));
    }, 1000);
    return () => clearTimeout(timer);
  }, [projectId, projectTitle, fringes, categories, availableBudget]);

  const grandTotal = useMemo(() => categories.reduce((sum, cat) => sum + cat.total, 0), [categories]);

  // Remaining calculation logic
  const budgetData = useMemo(() => {
    const cap = parseCurrency(availableBudget);
    if (cap === null || cap <= 0) return null;
    const remaining = cap - grandTotal;
    return { cap, remaining };
  }, [availableBudget, grandTotal]);

  const handleUpdateLine = useCallback((catId: string, accId: string, lineId: string, field: keyof BudgetLine, value: any) => {
    setCategories(prev => {
      const next = prev.map(cat => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          accounts: cat.accounts.map(acc => {
            if (acc.id !== accId) return acc;
            return {
              ...acc,
              lines: acc.lines.map(line => {
                if (line.id !== lineId) return line;
                return { ...line, [field]: value };
              })
            };
          })
        };
      });
      return recalculateBudget(next, INITIAL_GLOBALS, fringes);
    });
  }, [fringes]);

  const handleUpdateAccountName = useCallback((catId: string, accId: string, name: string) => {
    setCategories(prev => {
      const next = prev.map(cat => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          accounts: cat.accounts.map(acc => acc.id === accId ? { ...acc, name } : acc)
        };
      });
      return recalculateBudget(next, INITIAL_GLOBALS, fringes);
    });
  }, [fringes]);

  const handleUpdateCategoryNotes = useCallback((catId: string, notes: string) => {
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, notes } : c));
  }, []);

  const handleUpdateAccountNotes = useCallback((catId: string, accId: string, notes: string) => {
    setCategories(prev => prev.map(c => c.id === catId ? {
      ...c,
      accounts: c.accounts.map(a => a.id === accId ? { ...a, notes } : a)
    } : c));
  }, []);

  const handleArchiveCurrent = useCallback(() => {
    const total = categories.reduce((sum, cat) => sum + cat.total, 0);
    const newEntry: ArchiveEntry = {
      id: 'arch-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      title: projectTitle,
      date: new Date().toLocaleString('it-IT'),
      total,
      categories: JSON.parse(JSON.stringify(categories)),
      fringes: JSON.parse(JSON.stringify(fringes))
    };
    const updatedArchive = [newEntry, ...archive];
    setArchive(updatedArchive);
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(updatedArchive));
    
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 3000);
  }, [categories, projectTitle, fringes, archive]);

  const onLoadArchive = useCallback((entry: ArchiveEntry) => {
    setProjectId('prj-' + Math.random().toString(36).substr(2, 9));
    setProjectTitle(entry.title);
    setFringes(entry.fringes);
    setCategories(recalculateBudget(entry.categories, INITIAL_GLOBALS, entry.fringes));
    setCurrentView('editor');
    setIsSidebarOpen(false);
  }, []);

  const handleDeleteArchive = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Sei sicuro di voler eliminare definitivamente questa copia dall\'archivio?')) return;
    
    setArchive(prev => {
      const updated = prev.filter(entry => entry.id !== id);
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleResetBudget = useCallback(() => {
    if (!window.confirm('ATTENZIONE: Stai per resettare il budget attuale. Eventuali modifiche non archiviate andranno perse. Continuare?')) return;
    const freshState = createNewProjectState();
    setProjectId(freshState.projectId);
    setProjectTitle(freshState.title);
    setFringes(freshState.fringes);
    setCategories(freshState.categories);
    setSearchTerm('');
    setAvailableBudget(null);
    setCurrentView('editor');
    setIsSidebarOpen(false);
    localStorage.removeItem(CURRENT_PROJECT_KEY);
  }, []);

  const confirmAddCategory = () => {
    if (!newCatData.code || !newCatData.name) return;
    const newCategory: Category = {
      id: 'cat-' + Math.random().toString(36).substr(2, 9),
      code: newCatData.code,
      name: newCatData.name,
      accounts: [],
      total: 0
    };
    setCategories([...categories, newCategory].sort((a,b) => a.code.localeCompare(b.code)));
    setIsAddCatModalOpen(false);
    setNewCatData({ code: '', name: '' });
  };

  const handleAddAccount = (catId: string) => {
    setCategories(prev => {
      const next = prev.map(cat => {
        if (cat.id !== catId) return cat;
        const newAccount: Account = {
          id: 'acc-' + Math.random().toString(36).substr(2, 9),
          code: cat.code + '.' + (cat.accounts.length + 1).toString().padStart(2, '0'),
          name: 'NUOVA SOTTOCARTELLA',
          lines: [createLine('Nuova Voce')],
          total: 0
        };
        return { ...cat, accounts: [...cat.accounts, newAccount] };
      });
      return recalculateBudget(next, INITIAL_GLOBALS, fringes);
    });
  };

  const handleDeleteAccount = (catId: string, accId: string) => {
    setCategories(prev => {
      const next = prev.map(cat => {
        if (cat.id !== catId) return cat;
        return { ...cat, accounts: cat.accounts.filter(a => a.id !== accId) };
      });
      return recalculateBudget(next, INITIAL_GLOBALS, fringes);
    });
  };

  const handleDeleteCategory = (catId: string) => {
    setCategories(prev => {
      const next = prev.filter(c => c.id !== catId);
      return recalculateBudget(next, INITIAL_GLOBALS, fringes);
    });
  };

  const handleAddFringe = useCallback(() => {
    const newFringe: Fringe = {
      id: 'f-' + Math.random().toString(36).substr(2, 9),
      name: 'NUOVO ONERE',
      rate: 0,
      isAppliedByDefault: false
    };

    setFringes(prev => {
      const next = [...prev, newFringe];
      setCategories(cats => recalculateBudget(cats, INITIAL_GLOBALS, next));
      return next;
    });

    return newFringe.id;
  }, []);

  const handleUpdateFringe = (id: string, field: keyof Fringe, value: any) => {
    const nextFringes = fringes.map(f => f.id === id ? { ...f, [field]: value } : f);
    setFringes(nextFringes);
    setCategories(prev => recalculateBudget(prev, INITIAL_GLOBALS, nextFringes));
  };

  const handleDeleteFringe = (id: string) => {
    const nextFringes = fringes.filter(f => f.id !== id);
    setFringes(nextFringes);
    const cleaned = categories.map(cat => ({
      ...cat,
      accounts: cat.accounts.map(acc => ({
        ...acc,
        lines: acc.lines.map(l => ({ ...l, fringeIds: l.fringeIds.filter(fid => fid !== id) }))
      }))
    }));
    setCategories(recalculateBudget(cleaned, INITIAL_GLOBALS, nextFringes));
  };

  const handleShareBudget = useCallback(() => {
    const summary = categories
      .filter(c => c.total > 0)
      .map(c => `${c.code} ${c.name}: ${c.total.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}`)
      .join('\n');
    
    const shareText = `Budget Progetto: ${projectTitle}\nTotale: ${grandTotal.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}\n\nResoconto:\n${summary}`;

    if (navigator.share) {
      navigator.share({
        title: `Budget ${projectTitle}`,
        text: shareText,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Riepilogo copiato negli appunti!');
    }
  }, [categories, projectTitle, grandTotal]);

  const handleGeneratePdf = () => {
    exportBudgetPdf({
      productionTitle: exportHeader.productionTitle,
      version: exportHeader.version,
      exportDate: exportHeader.exportDate,
      includeCover: exportHeader.includeCover,
      leftInfo,
      rightInfo,
      categories,
      fringes
    });
    setIsExportModalOpen(false);
  };

  const updateInfoField = (col: 'left' | 'right', index: number, field: 'label' | 'value', val: string) => {
    if (col === 'left') {
      const next = [...leftInfo];
      next[index] = { ...next[index], [field]: val };
      setLeftInfo(next);
    } else {
      const next = [...rightInfo];
      next[index] = { ...next[index], [field]: val };
      setRightInfo(next);
    }
  };

  const handleOpenCapModal = () => {
    setTempCap(availableBudget || '');
    setIsCapModalOpen(true);
  };

  const handleSaveCap = () => {
    setAvailableBudget(tempCap || null);
    setIsCapModalOpen(false);
  };

  const handleRemoveCap = () => {
    setAvailableBudget(null);
    setIsCapModalOpen(false);
  };

  const activeCategories = useMemo(() => categories.filter(cat => cat.total > 0), [categories]);
  const chartData = useMemo(() => {
    return [...categories]
      .sort((a, b) => b.total - a.total)
      .slice(0, 7)
      .map(cat => ({
        id: cat.id,
        name: cat.name.length > 20 ? cat.name.substring(0, 17) + '...' : cat.name,
        total: cat.total
      }));
  }, [categories]);

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden text-slate-900 font-sans relative">
      {showSaveToast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900 text-emerald-400 px-8 py-4 rounded-2xl shadow-2xl border border-emerald-500/30 flex items-center gap-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            <span className="text-xs font-black uppercase tracking-[0.2em]">Budget Salvato con Successo</span>
          </div>
        </div>
      )}

      <Sidebar 
        fringes={fringes} 
        currentView={currentView}
        onUpdateFringe={handleUpdateFringe} 
        onDeleteFringe={handleDeleteFringe} 
        onAddFringe={handleAddFringe}
        onArchiveBudget={handleArchiveCurrent}
        onResetBudget={handleResetBudget}
        onNavigate={setCurrentView}
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="bg-white border-b border-slate-100 px-6 md:px-10 py-5 flex items-center justify-between shadow-sm z-30 shrink-0">
          <div className="flex items-center gap-6 min-w-0 flex-1">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-xl shrink-0 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="hidden sm:block shrink-0 cursor-pointer" onClick={() => setCurrentView('editor')}>
              <h1 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-indigo-600 transition-colors">NicoBudget Pro</h1>
            </div>
            {currentView !== 'summary' && (
              <div className="flex-1 max-w-2xl flex items-center gap-4">
                <input
                  disabled={currentView === 'archive'}
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value.toUpperCase())}
                  className="flex-1 bg-transparent border-none text-slate-900 font-black text-sm md:text-lg px-0 py-1 focus:ring-0 outline-none transition-all placeholder:text-slate-200 truncate tracking-tight"
                />
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {/* CAP STATUS PILL */}
            {budgetData && (
              <div 
                className={`hidden sm:flex flex-col items-end px-3 py-1.5 rounded-xl border transition-all animate-in fade-in slide-in-from-right-2 ${budgetData.remaining < 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}
                title={`Budget disponibile impostato: ${budgetData.cap.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}`}
              >
                <span className={`text-[8px] font-black uppercase tracking-widest ${budgetData.remaining < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                  {budgetData.remaining < 0 ? 'Sforato' : 'Rimanente'}
                </span>
                <span className={`text-xs font-bold mono-font ${budgetData.remaining < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                  {Math.abs(budgetData.remaining).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                </span>
              </div>
            )}

            <div className="flex items-center gap-3">
              {currentView !== 'summary' && (
                <button 
                  onClick={handleOpenCapModal}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                  title="Imposta Budget Disponibile"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
              )}

              <div 
                onClick={() => setCurrentView(currentView === 'summary' ? 'editor' : 'summary')}
                className={`text-right shrink-0 border-l border-slate-100 pl-4 sm:pl-8 cursor-pointer group transition-all p-2 rounded-2xl ${currentView === 'summary' ? 'bg-indigo-50 border-indigo-100' : 'hover:bg-slate-50'}`}
              >
                <span className={`block text-[9px] font-black uppercase tracking-[0.15em] mb-1 transition-colors ${currentView === 'summary' ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`}>
                  {currentView === 'summary' ? 'Chiudi Resoconto' : 'Budget Totale'}
                </span>
                <span className={`text-xl md:text-3xl font-black mono-font tracking-tighter transition-all inline-block ${currentView === 'summary' ? 'text-indigo-700' : 'text-blue-600 group-hover:scale-105'} animate-in zoom-in-95 duration-200`} key={grandTotal}>
                  {grandTotal.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50/50 scroll-smooth">
          {currentView === 'editor' && (
            <section className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-64 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} />
                    <YAxis hide />
                    <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }} formatter={(v: number) => v.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })} />
                    <Bar dataKey="total" radius={[8, 8, 0, 0]} barSize={50}>
                      {chartData.map((e, i) => <Cell key={e.id} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col min-h-[600px] overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-white overflow-hidden">
                  <div className="flex items-center gap-6 flex-1">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hidden lg:block whitespace-nowrap">Foglio di Lavoro</h2>
                    <div className="relative flex-1 max-w-sm">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      </span>
                      <input
                        type="text"
                        placeholder="Cerca codice o ruolo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-11 pr-4 py-2 text-xs bg-slate-50/50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                      />
                    </div>
                  </div>
                  <button onClick={() => setIsAddCatModalOpen(true)} className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition-all active:scale-95"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg></button>
                </div>
                <BudgetTable 
                  key={projectId}
                  categories={categories} globals={INITIAL_GLOBALS} fringes={fringes} searchTerm={searchTerm}
                  onUpdateLine={handleUpdateLine} onUpdateAccountName={handleUpdateAccountName} onAddLine={() => {}} onDeleteLine={() => {}}
                  onAddFringe={handleAddFringe} onAddAccount={handleAddAccount} onDeleteAccount={handleDeleteAccount} onDeleteCategory={handleDeleteCategory}
                  onUpdateCategoryNotes={handleUpdateCategoryNotes} onUpdateAccountNotes={handleUpdateAccountNotes}
                />
              </div>
            </section>
          )}

          {currentView === 'summary' && (
            <section className="p-4 md:p-12 max-w-5xl mx-auto animate-in slide-in-from-bottom-8 duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2 uppercase">Top Sheet Resoconto</h2>
                  <p className="text-slate-500 italic font-medium">Esporta e condividi la sintesi professionale del tuo progetto.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={() => setIsExportModalOpen(true)} 
                    className="group px-6 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-500 shadow-xl shadow-indigo-100 transition-all flex items-center gap-3 active:scale-95"
                  >
                    <svg className="w-5 h-5 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    Esporta PDF
                  </button>
                  <button 
                    onClick={handleShareBudget} 
                    className="px-6 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-500 shadow-xl shadow-emerald-100 transition-all flex items-center gap-3 active:scale-95"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                    Condividi
                  </button>
                  <button onClick={() => setCurrentView('editor')} className="px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-600 hover:bg-white transition-all">← Indietro</button>
                </div>
              </div>

              <div className="space-y-6">
                {activeCategories.length === 0 && (
                  <div className="bg-white p-24 rounded-[40px] border border-dashed border-slate-200 text-center">
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.3em] italic">Nessun costo inserito.</p>
                  </div>
                )}
                {activeCategories.map((cat, idx) => {
                  const percentage = grandTotal > 0 ? (cat.total / grandTotal) * 100 : 0;
                  const activeAccounts = cat.accounts.filter(a => a.total > 0);
                  
                  return (
                    <div key={cat.id} className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm group hover:border-indigo-100 transition-all">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-5">
                          <span className="text-[11px] font-black text-indigo-400 bg-indigo-50/50 px-3 py-1.5 rounded-xl mono-font border border-indigo-100/50">{cat.code}</span>
                          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{cat.name}</h3>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black text-slate-900 mono-font tracking-tighter">{cat.total.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{percentage.toFixed(1)}% dell'Above the Line</div>
                        </div>
                      </div>
                      
                      <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden mb-8 border border-slate-100/50">
                        <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${percentage}%`, backgroundColor: COLORS[idx % COLORS.length] }} />
                      </div>

                      <div className="mt-6 space-y-3 border-t border-slate-50 pt-8">
                        {activeAccounts.map(acc => (
                          <div key={acc.id} className="flex items-center justify-between group/item p-2 hover:bg-slate-50 rounded-xl transition-all">
                            <div className="flex items-center gap-4">
                              <span className="text-slate-300 font-bold mono-font text-[10px]">{acc.code}</span>
                              <span className="text-slate-600 font-bold uppercase tracking-tight text-[11px] group-hover/item:text-indigo-600 transition-colors">{acc.name}</span>
                            </div>
                            <span className="text-slate-900 font-black mono-font text-xs">{acc.total.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</span>
                          </div>
                        ))}
                        <div className="mt-4 flex justify-between items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Account Total for {cat.code}</span>
                          <span className="text-indigo-600 font-black mono-font text-sm">{cat.total.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {activeCategories.length > 0 && (
                <div className="mt-12 bg-slate-900 rounded-[40px] p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-slate-200">
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Stima Totale Finalizzata</h4>
                    <p className="text-4xl font-black mono-font tracking-tighter text-indigo-400">{grandTotal.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</p>
                  </div>
                </div>
              )}
            </section>
          )}

          {currentView === 'archive' && (
            <section className="p-4 md:p-12 max-w-4xl mx-auto animate-in slide-in-from-bottom-8 duration-500">
              <div className="flex items-center justify-between mb-12">
                <div><h2 className="text-4xl font-black text-slate-900 tracking-tight mb-1">Archivio Budget</h2><p className="text-slate-400 font-medium">Gestisci le tue copie salvate.</p></div>
                <button onClick={() => setCurrentView('editor')} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black shadow-xl shadow-indigo-200 transition-all active:scale-95 uppercase tracking-widest">VAI ALL'EDITOR →</button>
              </div>
              <div className="grid grid-cols-1 gap-8">
                {archive.length === 0 && (
                  <div className="text-center py-32 bg-white rounded-[40px] border border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Archivio vuoto.</p>
                  </div>
                )}
                {archive.map(entry => (
                  <div key={entry.id} className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm group relative hover:shadow-md transition-all">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                      <div className="flex-1 space-y-4">
                         <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-300 uppercase tracking-widest mono-font">{entry.date}</span>
                            <button 
                              type="button"
                              onClick={(e) => handleDeleteArchive(entry.id, e)} 
                              className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all active:scale-90 z-20 relative cursor-pointer group/del"
                              title="Elimina definitivamente"
                            >
                              <svg className="w-6 h-6 pointer-events-none group-hover/del:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                         </div>
                         <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">{entry.title}</h3>
                         <div className="text-4xl font-black text-indigo-500 mono-font tracking-tighter">{entry.total.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => onLoadArchive(entry)} className="bg-indigo-50 text-indigo-600 px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95">APRI PROGETTO</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* CAP MODAL */}
      {isCapModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
            <div className="bg-slate-50/50 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Budget Disponibile (Cap)</h3>
              <button onClick={() => setIsCapModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Inserisci importo massimo</label>
                <input 
                  type="text" 
                  value={tempCap} 
                  onChange={(e) => setTempCap(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-center text-xl font-black text-indigo-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-200" 
                  placeholder="es. 5.000,00"
                  autoFocus
                />
              </div>
            </div>
            <div className="bg-slate-50/50 px-8 py-6 flex flex-col gap-3">
              <button onClick={handleSaveCap} className="w-full py-4 text-[11px] font-black text-white bg-indigo-600 hover:bg-indigo-500 rounded-2xl shadow-xl transition-all uppercase tracking-widest active:scale-95">Salva Budget</button>
              <button onClick={handleRemoveCap} className="w-full py-4 text-[11px] font-black text-red-500 hover:bg-red-50 rounded-2xl transition-all uppercase tracking-widest active:scale-95">Rimuovi Cap</button>
              <button onClick={() => setIsCapModalOpen(false)} className="w-full py-2 text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-all uppercase tracking-widest">Annulla</button>
            </div>
          </div>
        </div>
      )}

      {/* SETUP EXPORT PDF MODAL */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 my-8">
            <div className="bg-slate-50/50 px-8 py-6 border-b border-slate-100 flex items-center justify-between"><h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.25em]">Export Setup PDF</h3><button onClick={() => setIsExportModalOpen(false)} className="text-slate-400 hover:text-slate-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div>
            <div className="p-8 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div><label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Production Title</label><input type="text" value={exportHeader.productionTitle} onChange={(e) => setExportHeader({...exportHeader, productionTitle: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                <div><label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Version</label><input type="text" value={exportHeader.version} onChange={(e) => setExportHeader({...exportHeader, version: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                <div><label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Export Date</label><input type="date" value={exportHeader.exportDate} onChange={(e) => setExportHeader({...exportHeader, exportDate: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-6 border-t border-slate-50">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4">Colonna Sinistra</h4>
                  {leftInfo.map((item, idx) => (
                    <div key={idx} className="flex gap-2"><input placeholder="Label" value={item.label} onChange={(e) => updateInfoField('left', idx, 'label', e.target.value)} className="w-1/3 bg-slate-50/50 border border-slate-100 rounded-lg px-3 py-2 text-[10px] font-bold outline-none" /><input placeholder="Valore" value={item.value} onChange={(e) => updateInfoField('left', idx, 'value', e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium outline-none" /></div>
                  ))}
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4">Colonna Destra</h4>
                  {rightInfo.map((item, idx) => (
                    <div key={idx} className="flex gap-2"><input placeholder="Label" value={item.label} onChange={(e) => updateInfoField('right', idx, 'label', e.target.value)} className="w-1/3 bg-slate-50/50 border border-slate-100 rounded-lg px-3 py-2 text-[10px] font-bold outline-none" /><input placeholder="Valore" value={item.value} onChange={(e) => updateInfoField('right', idx, 'value', e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium outline-none" /></div>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all"><input type="checkbox" checked={exportHeader.includeCover} onChange={(e) => setExportHeader({...exportHeader, includeCover: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-indigo-600" /><span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Includi Copertina</span></label>
            </div>
            <div className="bg-slate-50/80 px-8 py-6 flex gap-4"><button onClick={() => setIsExportModalOpen(false)} className="flex-1 px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-200 rounded-2xl transition-all">Annulla</button><button onClick={handleGeneratePdf} className="flex-[2] px-6 py-4 text-[11px] font-black text-white bg-indigo-600 hover:bg-indigo-500 rounded-2xl shadow-xl transition-all uppercase tracking-widest active:scale-95">Genera PDF Professionale</button></div>
          </div>
        </div>
      )}

      {isAddCatModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="bg-slate-50/50 px-8 py-6 border-b border-slate-100 flex items-center justify-between"><h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Nuova Cartella Budget</h3><button onClick={() => setIsAddCatModalOpen(false)} className="text-slate-400 hover:text-slate-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div>
            <div className="p-8 space-y-6">
              <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Codice Identificativo</label><input autoFocus type="text" value={newCatData.code} onChange={(e) => setNewCatData({...newCatData, code: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="es. 4300" /></div>
              <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nome Categoria</label><input type="text" value={newCatData.name} onChange={(e) => setNewCatData({...newCatData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="es. Varie ed Eventuali" onKeyDown={(e) => e.key === 'Enter' && confirmAddCategory()} /></div>
            </div>
            <div className="bg-slate-50/50 px-8 py-6 flex gap-4"><button onClick={() => setIsAddCatModalOpen(false)} className="flex-1 px-4 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-200 rounded-xl">Annulla</button><button onClick={confirmAddCategory} className="flex-[2] px-4 py-3 text-[11px] font-black text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xl transition-all uppercase tracking-widest active:scale-95">Crea Categoria</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;