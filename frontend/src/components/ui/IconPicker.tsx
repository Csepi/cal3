/**
 * IconPicker Component
 *
 * Allows users to select an emoji/icon for calendars, events, and resource types
 * Features:
 * - Predefined emoji categories with searchable names
 * - Search functionality by icon name
 * - Custom emoji input
 * - High z-index for modal compatibility
 * - Compact, accessible design
 */

import React, { useState, useMemo } from 'react';

import { tStatic } from '../../i18n';

interface IconPickerProps {
  value?: string;
  onChange: (icon: string | undefined) => void;
  placeholder?: string;
  category?: 'calendar' | 'event' | 'resource' | 'all';
}

const ICON_CATEGORIES = {
  calendar: {
    label: 'Calendar Icons',
    icons: [
      { icon: '📅', name: 'calendar', keywords: ['calendar', 'date', 'schedule'] },
      { icon: '📆', name: 'calendar-page', keywords: ['calendar', 'page', 'date'] },
      { icon: '🗓️', name: 'calendar-spiral', keywords: ['calendar', 'spiral', 'schedule'] },
      { icon: '📋', name: 'clipboard', keywords: ['clipboard', 'list', 'notes'] },
      { icon: '📝', name: 'memo', keywords: ['memo', 'note', 'write'] },
      { icon: '📄', name: 'document', keywords: ['document', 'file', 'paper'] },
      { icon: '📌', name: 'pin', keywords: ['pin', 'mark', 'important'] },
      { icon: '📍', name: 'location', keywords: ['location', 'place', 'map'] },
      { icon: '🗂️', name: 'organizer', keywords: ['organizer', 'folder', 'files'] },
      { icon: '📊', name: 'chart', keywords: ['chart', 'graph', 'stats'] },
      { icon: '📁', name: 'folder', keywords: ['folder', 'directory', 'files'] },
      { icon: '📂', name: 'open-folder', keywords: ['folder', 'open', 'files'] },
      { icon: '📃', name: 'page', keywords: ['page', 'document', 'paper'] },
      { icon: '📑', name: 'bookmark', keywords: ['bookmark', 'tab', 'mark'] },
      { icon: '📒', name: 'notebook', keywords: ['notebook', 'journal', 'notes'] },
      { icon: '📓', name: 'notebook-cover', keywords: ['notebook', 'book', 'notes'] },
      { icon: '📔', name: 'notebook-decorative', keywords: ['notebook', 'decorated', 'journal'] },
      { icon: '📕', name: 'closed-book', keywords: ['book', 'closed', 'read'] },
      { icon: '📖', name: 'open-book', keywords: ['book', 'open', 'read'] },
      { icon: '📗', name: 'green-book', keywords: ['book', 'green', 'read'] },
      { icon: '📘', name: 'blue-book', keywords: ['book', 'blue', 'read'] },
      { icon: '📙', name: 'orange-book', keywords: ['book', 'orange', 'read'] },
      { icon: '📚', name: 'books', keywords: ['books', 'library', 'study'] },
      { icon: '📇', name: 'card-index', keywords: ['index', 'cards', 'organize'] },
      { icon: '🗃️', name: 'card-box', keywords: ['box', 'storage', 'files'] },
      { icon: '🗄️', name: 'filing-cabinet', keywords: ['cabinet', 'filing', 'storage'] },
      { icon: '📈', name: 'trending-up', keywords: ['chart', 'trending', 'increase'] },
      { icon: '📉', name: 'trending-down', keywords: ['chart', 'trending', 'decrease'] },
      { icon: '🗒️', name: 'notepad', keywords: ['notepad', 'paper', 'notes'] },
      { icon: '🗓', name: 'desk-calendar', keywords: ['calendar', 'desk', 'date'] },
      { icon: '📎', name: 'paperclip', keywords: ['clip', 'attach', 'paper'] },
      { icon: '🖇️', name: 'linked-clips', keywords: ['clips', 'linked', 'attach'] },
      { icon: '📏', name: 'ruler', keywords: ['ruler', 'measure', 'straight'] },
      { icon: '📐', name: 'triangle-ruler', keywords: ['ruler', 'triangle', 'measure'] },
      { icon: '✂️', name: 'scissors', keywords: ['scissors', 'cut', 'trim'] },
      { icon: '🖊️', name: 'pen', keywords: ['pen', 'write', 'ink'] },
      { icon: '🖋️', name: 'fountain-pen', keywords: ['pen', 'fountain', 'write'] },
      { icon: '✒️', name: 'nib', keywords: ['nib', 'pen', 'write'] },
      { icon: '🖍️', name: 'crayon', keywords: ['crayon', 'draw', 'color'] },
      { icon: '📐', name: 'triangular', keywords: ['triangle', 'ruler', 'geometry'] },
    ],
  },
  event: {
    label: 'Event Icons',
    icons: [
      // Celebrations & Parties
      { icon: '🎉', name: 'party', keywords: ['party', 'celebration', 'fun'] },
      { icon: '🎊', name: 'confetti', keywords: ['confetti', 'celebration', 'party'] },
      { icon: '🎈', name: 'balloon', keywords: ['balloon', 'party', 'birthday'] },
      { icon: '🎁', name: 'gift', keywords: ['gift', 'present', 'surprise'] },
      { icon: '🎀', name: 'ribbon', keywords: ['ribbon', 'bow', 'gift'] },
      { icon: '🎂', name: 'birthday-cake', keywords: ['cake', 'birthday', 'celebration'] },
      { icon: '🍰', name: 'cake', keywords: ['cake', 'dessert', 'birthday'] },
      { icon: '🧁', name: 'cupcake', keywords: ['cupcake', 'dessert', 'sweet'] },
      { icon: '🎆', name: 'fireworks', keywords: ['fireworks', 'celebration', 'display'] },
      { icon: '🎇', name: 'sparkler', keywords: ['sparkler', 'celebration', 'fire'] },
      { icon: '✨', name: 'sparkles', keywords: ['sparkles', 'magic', 'special'] },
      { icon: '🌟', name: 'star-shine', keywords: ['star', 'shine', 'special'] },
      { icon: '⭐', name: 'star', keywords: ['star', 'favorite', 'important'] },

      // Entertainment
      { icon: '🎪', name: 'circus', keywords: ['circus', 'tent', 'show'] },
      { icon: '🎭', name: 'theater', keywords: ['theater', 'drama', 'performance'] },
      { icon: '🎨', name: 'art', keywords: ['art', 'paint', 'creative'] },
      { icon: '🎬', name: 'movie', keywords: ['movie', 'film', 'cinema'] },
      { icon: '🎥', name: 'video-camera', keywords: ['video', 'camera', 'film'] },
      { icon: '📽️', name: 'projector', keywords: ['projector', 'film', 'movie'] },
      { icon: '🎵', name: 'music', keywords: ['music', 'note', 'song'] },
      { icon: '🎶', name: 'musical-notes', keywords: ['music', 'notes', 'song'] },
      { icon: '🎤', name: 'microphone', keywords: ['microphone', 'sing', 'speak'] },
      { icon: '🎧', name: 'headphones', keywords: ['headphones', 'music', 'listen'] },
      { icon: '🎼', name: 'musical-score', keywords: ['music', 'score', 'notes'] },
      { icon: '🎹', name: 'piano', keywords: ['piano', 'music', 'keyboard'] },
      { icon: '🎸', name: 'guitar', keywords: ['guitar', 'music', 'rock'] },
      { icon: '🎺', name: 'trumpet', keywords: ['trumpet', 'music', 'brass'] },
      { icon: '🎻', name: 'violin', keywords: ['violin', 'music', 'strings'] },
      { icon: '🥁', name: 'drum', keywords: ['drum', 'music', 'percussion'] },
      { icon: '🎮', name: 'gaming', keywords: ['gaming', 'game', 'play'] },

      // Sports & Activities
      { icon: '⚽', name: 'soccer', keywords: ['soccer', 'sport', 'football'] },
      { icon: '🏀', name: 'basketball', keywords: ['basketball', 'sport', 'game'] },
      { icon: '🏈', name: 'football', keywords: ['football', 'sport', 'american'] },
      { icon: '⚾', name: 'baseball', keywords: ['baseball', 'sport', 'game'] },
      { icon: '🎾', name: 'tennis', keywords: ['tennis', 'sport', 'game'] },
      { icon: '🏐', name: 'volleyball', keywords: ['volleyball', 'sport', 'game'] },
      { icon: '🏉', name: 'rugby', keywords: ['rugby', 'sport', 'game'] },
      { icon: '🎱', name: 'billiards', keywords: ['billiards', 'pool', 'game'] },
      { icon: '🏓', name: 'ping-pong', keywords: ['ping-pong', 'table-tennis', 'sport'] },
      { icon: '🏸', name: 'badminton', keywords: ['badminton', 'sport', 'game'] },
      { icon: '🥊', name: 'boxing', keywords: ['boxing', 'sport', 'fight'] },
      { icon: '🥋', name: 'martial-arts', keywords: ['martial-arts', 'karate', 'sport'] },
      { icon: '🏋️', name: 'workout', keywords: ['workout', 'exercise', 'gym'] },
      { icon: '🤸', name: 'gymnastics', keywords: ['gymnastics', 'sport', 'exercise'] },
      { icon: '🏃', name: 'running', keywords: ['running', 'sport', 'exercise'] },
      { icon: '🚴', name: 'cycling', keywords: ['cycling', 'bike', 'sport'] },
      { icon: '🏊', name: 'swimming', keywords: ['swimming', 'sport', 'pool'] },
      { icon: '🏄', name: 'surfing', keywords: ['surfing', 'sport', 'ocean'] },
      { icon: '⛷️', name: 'skiing', keywords: ['skiing', 'sport', 'winter'] },
      { icon: '🏂', name: 'snowboard', keywords: ['snowboard', 'sport', 'winter'] },
      { icon: '🤿', name: 'diving', keywords: ['diving', 'scuba', 'underwater'] },
      { icon: '⛹️', name: 'basketball-player', keywords: ['basketball', 'player', 'sport'] },
      { icon: '🧘', name: 'yoga', keywords: ['yoga', 'meditation', 'exercise'] },

      // Food & Drinks
      { icon: '🍕', name: 'pizza', keywords: ['pizza', 'food', 'meal'] },
      { icon: '🍔', name: 'burger', keywords: ['burger', 'food', 'meal'] },
      { icon: '🍟', name: 'fries', keywords: ['fries', 'food', 'fast-food'] },
      { icon: '🌭', name: 'hotdog', keywords: ['hotdog', 'food', 'meal'] },
      { icon: '🥪', name: 'sandwich', keywords: ['sandwich', 'food', 'meal'] },
      { icon: '🌮', name: 'taco', keywords: ['taco', 'food', 'mexican'] },
      { icon: '🌯', name: 'burrito', keywords: ['burrito', 'food', 'mexican'] },
      { icon: '🥗', name: 'salad', keywords: ['salad', 'food', 'healthy'] },
      { icon: '🍝', name: 'pasta', keywords: ['pasta', 'food', 'italian'] },
      { icon: '🍜', name: 'noodles', keywords: ['noodles', 'food', 'asian'] },
      { icon: '🍱', name: 'bento', keywords: ['bento', 'food', 'japanese'] },
      { icon: '🍣', name: 'sushi', keywords: ['sushi', 'food', 'japanese'] },
      { icon: '🍛', name: 'curry', keywords: ['curry', 'food', 'spicy'] },
      { icon: '🍲', name: 'stew', keywords: ['stew', 'food', 'soup'] },
      { icon: '🥘', name: 'paella', keywords: ['paella', 'food', 'spanish'] },
      { icon: '🍳', name: 'cooking', keywords: ['cooking', 'food', 'breakfast'] },
      { icon: '🥞', name: 'pancakes', keywords: ['pancakes', 'food', 'breakfast'] },
      { icon: '🧇', name: 'waffle', keywords: ['waffle', 'food', 'breakfast'] },
      { icon: '🥓', name: 'bacon', keywords: ['bacon', 'food', 'breakfast'] },
      { icon: '🍎', name: 'apple', keywords: ['apple', 'fruit', 'food'] },
      { icon: '🍊', name: 'orange', keywords: ['orange', 'fruit', 'food'] },
      { icon: '🍋', name: 'lemon', keywords: ['lemon', 'fruit', 'food'] },
      { icon: '🍌', name: 'banana', keywords: ['banana', 'fruit', 'food'] },
      { icon: '🍉', name: 'watermelon', keywords: ['watermelon', 'fruit', 'food'] },
      { icon: '🍇', name: 'grapes', keywords: ['grapes', 'fruit', 'food'] },
      { icon: '🍓', name: 'strawberry', keywords: ['strawberry', 'fruit', 'food'] },
      { icon: '🥤', name: 'drink', keywords: ['drink', 'beverage', 'soda'] },
      { icon: '☕', name: 'coffee', keywords: ['coffee', 'drink', 'cafe'] },
      { icon: '🍵', name: 'tea', keywords: ['tea', 'drink', 'hot'] },
      { icon: '🧃', name: 'juice', keywords: ['juice', 'drink', 'beverage'] },
      { icon: '🥛', name: 'milk', keywords: ['milk', 'drink', 'beverage'] },
      { icon: '🍷', name: 'wine', keywords: ['wine', 'drink', 'alcohol'] },
      { icon: '🍺', name: 'beer', keywords: ['beer', 'drink', 'alcohol'] },
      { icon: '🍻', name: 'beers', keywords: ['beers', 'drink', 'cheers'] },
      { icon: '🥂', name: 'champagne', keywords: ['champagne', 'drink', 'celebration'] },
      { icon: '🍹', name: 'cocktail', keywords: ['cocktail', 'drink', 'tropical'] },
      { icon: '🍸', name: 'martini', keywords: ['martini', 'drink', 'cocktail'] },

      // Work & Education
      { icon: '💼', name: 'briefcase', keywords: ['briefcase', 'work', 'business'] },
      { icon: '📊', name: 'chart', keywords: ['chart', 'graph', 'stats'] },
      { icon: '📈', name: 'trending-up', keywords: ['chart', 'trending', 'increase'] },
      { icon: '📉', name: 'trending-down', keywords: ['chart', 'trending', 'decrease'] },
      { icon: '🎓', name: 'graduation', keywords: ['graduation', 'education', 'school'] },
      { icon: '📚', name: 'books', keywords: ['books', 'library', 'study'] },
      { icon: '📖', name: 'open-book', keywords: ['book', 'open', 'read'] },
      { icon: '✏️', name: 'pencil', keywords: ['pencil', 'write', 'draw'] },
      { icon: '📝', name: 'memo', keywords: ['memo', 'note', 'write'] },
      { icon: '🖊️', name: 'pen', keywords: ['pen', 'write', 'ink'] },

      // Awards & Achievements
      { icon: '🏆', name: 'trophy', keywords: ['trophy', 'award', 'winner'] },
      { icon: '🥇', name: 'gold-medal', keywords: ['medal', 'gold', 'first'] },
      { icon: '🥈', name: 'silver-medal', keywords: ['medal', 'silver', 'second'] },
      { icon: '🥉', name: 'bronze-medal', keywords: ['medal', 'bronze', 'third'] },
      { icon: '🏅', name: 'medal', keywords: ['medal', 'award', 'achievement'] },
      { icon: '🎖️', name: 'military-medal', keywords: ['medal', 'military', 'honor'] },

      // Goals & Targets
      { icon: '🎯', name: 'target', keywords: ['target', 'goal', 'aim'] },
      { icon: '🎪', name: 'performance', keywords: ['performance', 'show', 'event'] },
    ],
  },
  resource: {
    label: 'Resource Icons',
    icons: [
      // Buildings & Places
      { icon: '🏢', name: 'building', keywords: ['building', 'office', 'work'] },
      { icon: '🏛️', name: 'classical-building', keywords: ['building', 'classical', 'government'] },
      { icon: '🏦', name: 'bank', keywords: ['bank', 'finance', 'money'] },
      { icon: '🏪', name: 'shop', keywords: ['shop', 'store', 'retail'] },
      { icon: '🏬', name: 'department-store', keywords: ['store', 'shopping', 'mall'] },
      { icon: '🏨', name: 'hotel', keywords: ['hotel', 'lodging', 'accommodation'] },
      { icon: '🏩', name: 'love-hotel', keywords: ['hotel', 'lodging', 'accommodation'] },
      { icon: '🏫', name: 'school', keywords: ['school', 'education', 'learning'] },
      { icon: '🏭', name: 'factory', keywords: ['factory', 'industry', 'manufacturing'] },
      { icon: '🏗️', name: 'construction', keywords: ['construction', 'building', 'crane'] },
      { icon: '🏚️', name: 'derelict-house', keywords: ['house', 'abandoned', 'old'] },
      { icon: '🏠', name: 'house', keywords: ['house', 'home', 'residence'] },
      { icon: '🏡', name: 'house-garden', keywords: ['house', 'home', 'garden'] },
      { icon: '🏘️', name: 'houses', keywords: ['houses', 'neighborhood', 'residential'] },
      { icon: '🏰', name: 'castle', keywords: ['castle', 'fortress', 'medieval'] },
      { icon: '🏯', name: 'japanese-castle', keywords: ['castle', 'japanese', 'fortress'] },
      { icon: '🏟️', name: 'stadium', keywords: ['stadium', 'sports', 'arena'] },
      { icon: '🗼', name: 'tower', keywords: ['tower', 'tokyo', 'landmark'] },
      { icon: '🗽', name: 'statue-of-liberty', keywords: ['statue', 'liberty', 'landmark'] },
      { icon: '⛪', name: 'church', keywords: ['church', 'religion', 'building'] },
      { icon: '🕌', name: 'mosque', keywords: ['mosque', 'religion', 'building'] },
      { icon: '🛕', name: 'temple', keywords: ['temple', 'religion', 'building'] },
      { icon: '🕍', name: 'synagogue', keywords: ['synagogue', 'religion', 'building'] },

      // Vehicles - Land
      { icon: '🚗', name: 'car', keywords: ['car', 'vehicle', 'auto'] },
      { icon: '🚙', name: 'suv', keywords: ['suv', 'vehicle', 'car'] },
      { icon: '🚕', name: 'taxi', keywords: ['taxi', 'cab', 'transport'] },
      { icon: '🚌', name: 'bus', keywords: ['bus', 'transport', 'public'] },
      { icon: '🚎', name: 'trolleybus', keywords: ['trolleybus', 'transport', 'public'] },
      { icon: '🏎️', name: 'race-car', keywords: ['car', 'racing', 'fast'] },
      { icon: '🚓', name: 'police-car', keywords: ['police', 'car', 'emergency'] },
      { icon: '🚑', name: 'ambulance', keywords: ['ambulance', 'emergency', 'medical'] },
      { icon: '🚒', name: 'fire-truck', keywords: ['fire', 'truck', 'emergency'] },
      { icon: '🚐', name: 'minibus', keywords: ['minibus', 'van', 'transport'] },
      { icon: '🚚', name: 'delivery-truck', keywords: ['truck', 'delivery', 'transport'] },
      { icon: '🚛', name: 'semi-truck', keywords: ['truck', 'semi', 'transport'] },
      { icon: '🚜', name: 'tractor', keywords: ['tractor', 'farm', 'agriculture'] },
      { icon: '🛵', name: 'scooter', keywords: ['scooter', 'moped', 'transport'] },
      { icon: '🏍️', name: 'motorcycle', keywords: ['motorcycle', 'bike', 'transport'] },
      { icon: '🚲', name: 'bicycle', keywords: ['bicycle', 'bike', 'transport'] },
      { icon: '🛴', name: 'kick-scooter', keywords: ['scooter', 'kick', 'transport'] },

      // Vehicles - Air & Water
      { icon: '✈️', name: 'airplane', keywords: ['airplane', 'plane', 'flight'] },
      { icon: '🛩️', name: 'small-airplane', keywords: ['airplane', 'small', 'plane'] },
      { icon: '🚁', name: 'helicopter', keywords: ['helicopter', 'chopper', 'flight'] },
      { icon: '🚀', name: 'rocket', keywords: ['rocket', 'space', 'launch'] },
      { icon: '🛸', name: 'flying-saucer', keywords: ['ufo', 'saucer', 'alien'] },
      { icon: '🚂', name: 'train', keywords: ['train', 'locomotive', 'transport'] },
      { icon: '🚆', name: 'fast-train', keywords: ['train', 'fast', 'transport'] },
      { icon: '🚇', name: 'metro', keywords: ['metro', 'subway', 'train'] },
      { icon: '🚊', name: 'tram', keywords: ['tram', 'streetcar', 'transport'] },
      { icon: '🚝', name: 'monorail', keywords: ['monorail', 'train', 'transport'] },
      { icon: '🚃', name: 'railway-car', keywords: ['railway', 'car', 'train'] },
      { icon: '🚄', name: 'bullet-train', keywords: ['train', 'bullet', 'fast'] },
      { icon: '🚅', name: 'high-speed-train', keywords: ['train', 'high-speed', 'fast'] },
      { icon: '⛵', name: 'sailboat', keywords: ['sailboat', 'boat', 'sailing'] },
      { icon: '🚤', name: 'speedboat', keywords: ['speedboat', 'boat', 'fast'] },
      { icon: '🛥️', name: 'motor-boat', keywords: ['boat', 'motor', 'water'] },
      { icon: '🛳️', name: 'passenger-ship', keywords: ['ship', 'passenger', 'cruise'] },
      { icon: '⛴️', name: 'ferry', keywords: ['ferry', 'boat', 'transport'] },
      { icon: '🚢', name: 'ship', keywords: ['ship', 'boat', 'ocean'] },

      // Technology & Devices
      { icon: '💻', name: 'laptop', keywords: ['laptop', 'computer', 'tech'] },
      { icon: '🖥️', name: 'desktop', keywords: ['desktop', 'computer', 'monitor'] },
      { icon: '🖨️', name: 'printer', keywords: ['printer', 'print', 'device'] },
      { icon: '⌨️', name: 'keyboard', keywords: ['keyboard', 'typing', 'input'] },
      { icon: '🖱️', name: 'mouse', keywords: ['mouse', 'computer', 'click'] },
      { icon: '🖲️', name: 'trackball', keywords: ['trackball', 'mouse', 'input'] },
      { icon: '💾', name: 'floppy-disk', keywords: ['disk', 'floppy', 'storage'] },
      { icon: '💿', name: 'cd', keywords: ['cd', 'disc', 'storage'] },
      { icon: '📀', name: 'dvd', keywords: ['dvd', 'disc', 'storage'] },
      { icon: '📱', name: 'phone', keywords: ['phone', 'mobile', 'smartphone'] },
      { icon: '📞', name: 'telephone', keywords: ['telephone', 'phone', 'call'] },
      { icon: '☎️', name: 'old-phone', keywords: ['phone', 'old', 'telephone'] },
      { icon: '📟', name: 'pager', keywords: ['pager', 'beeper', 'device'] },
      { icon: '📠', name: 'fax', keywords: ['fax', 'machine', 'office'] },
      { icon: '📺', name: 'tv', keywords: ['tv', 'television', 'screen'] },
      { icon: '📻', name: 'radio', keywords: ['radio', 'music', 'broadcast'] },
      { icon: '🎙️', name: 'studio-mic', keywords: ['microphone', 'studio', 'recording'] },
      { icon: '📡', name: 'satellite', keywords: ['satellite', 'antenna', 'dish'] },
      { icon: '🔋', name: 'battery', keywords: ['battery', 'power', 'energy'] },
      { icon: '🔌', name: 'plug', keywords: ['plug', 'electric', 'power'] },
      { icon: '💡', name: 'lightbulb', keywords: ['lightbulb', 'idea', 'light'] },
      { icon: '🔦', name: 'flashlight', keywords: ['flashlight', 'torch', 'light'] },
      { icon: '🕯️', name: 'candle', keywords: ['candle', 'light', 'flame'] },

      // Tools & Equipment
      { icon: '🛠️', name: 'tools', keywords: ['tools', 'repair', 'fix'] },
      { icon: '🔧', name: 'wrench', keywords: ['wrench', 'tool', 'fix'] },
      { icon: '🔨', name: 'hammer', keywords: ['hammer', 'tool', 'build'] },
      { icon: '⚒️', name: 'hammer-pick', keywords: ['hammer', 'pick', 'tool'] },
      { icon: '🛡️', name: 'shield', keywords: ['shield', 'protection', 'security'] },
      { icon: '⚙️', name: 'settings', keywords: ['settings', 'gear', 'config'] },
      { icon: '🗜️', name: 'clamp', keywords: ['clamp', 'tool', 'grip'] },
      { icon: '⚖️', name: 'scale', keywords: ['scale', 'balance', 'justice'] },
      { icon: '🦯', name: 'cane', keywords: ['cane', 'walking', 'accessibility'] },
      { icon: '🔗', name: 'link', keywords: ['link', 'chain', 'connection'] },
      { icon: '⛓️', name: 'chains', keywords: ['chains', 'link', 'metal'] },
      { icon: '🪓', name: 'axe', keywords: ['axe', 'tool', 'chop'] },
      { icon: '🔪', name: 'knife', keywords: ['knife', 'blade', 'cut'] },
      { icon: '🗡️', name: 'sword', keywords: ['sword', 'blade', 'weapon'] },
      { icon: '⚔️', name: 'crossed-swords', keywords: ['swords', 'crossed', 'battle'] },
      { icon: '🏹', name: 'bow-arrow', keywords: ['bow', 'arrow', 'archery'] },

      // Packages & Storage
      { icon: '📦', name: 'package', keywords: ['package', 'box', 'delivery'] },
      { icon: '📫', name: 'mailbox', keywords: ['mailbox', 'mail', 'post'] },
      { icon: '📪', name: 'mailbox-empty', keywords: ['mailbox', 'empty', 'mail'] },
      { icon: '📬', name: 'mailbox-flag', keywords: ['mailbox', 'flag', 'mail'] },
      { icon: '📭', name: 'mailbox-no-flag', keywords: ['mailbox', 'no-flag', 'mail'] },
      { icon: '📮', name: 'postbox', keywords: ['postbox', 'mail', 'post'] },
      { icon: '🗳️', name: 'ballot-box', keywords: ['ballot', 'box', 'voting'] },

      // Media & Entertainment
      { icon: '📷', name: 'camera', keywords: ['camera', 'photo', 'picture'] },
      { icon: '📸', name: 'camera-flash', keywords: ['camera', 'flash', 'photo'] },
      { icon: '📹', name: 'video-camera', keywords: ['video', 'camera', 'recording'] },
      { icon: '🎥', name: 'movie-camera', keywords: ['movie', 'camera', 'film'] },
      { icon: '🎬', name: 'clapper', keywords: ['clapper', 'movie', 'film'] },
      { icon: '📽️', name: 'film-projector', keywords: ['projector', 'film', 'movie'] },
      { icon: '🎞️', name: 'film-frames', keywords: ['film', 'frames', 'movie'] },
      { icon: '📞', name: 'phone-receiver', keywords: ['phone', 'receiver', 'call'] },
    ],
  },
  common: {
    label: 'Common Icons',
    icons: [
      // Status & Feedback
      { icon: '✅', name: 'check', keywords: ['check', 'yes', 'done'] },
      { icon: '✔️', name: 'check-mark', keywords: ['check', 'mark', 'yes'] },
      { icon: '☑️', name: 'checkbox', keywords: ['checkbox', 'check', 'yes'] },
      { icon: '❌', name: 'cross', keywords: ['cross', 'no', 'cancel'] },
      { icon: '❎', name: 'cross-mark', keywords: ['cross', 'mark', 'no'] },
      { icon: '⭕', name: 'hollow-circle', keywords: ['circle', 'hollow', 'no'] },
      { icon: '⚠️', name: 'warning', keywords: ['warning', 'alert', 'caution'] },
      { icon: '‼️', name: 'double-exclamation', keywords: ['exclamation', 'alert', 'important'] },
      { icon: '⁉️', name: 'question-exclamation', keywords: ['question', 'exclamation', 'confused'] },
      { icon: '❓', name: 'question', keywords: ['question', 'help', 'unknown'] },
      { icon: '❔', name: 'white-question', keywords: ['question', 'help', 'unknown'] },
      { icon: '❗', name: 'exclamation', keywords: ['exclamation', 'important', 'alert'] },
      { icon: '❕', name: 'white-exclamation', keywords: ['exclamation', 'important', 'alert'] },
      { icon: '🔔', name: 'bell', keywords: ['bell', 'notification', 'alert'] },
      { icon: '🔕', name: 'bell-slash', keywords: ['bell', 'mute', 'silent'] },
      { icon: '📢', name: 'announcement', keywords: ['announcement', 'megaphone', 'broadcast'] },
      { icon: '📣', name: 'megaphone', keywords: ['megaphone', 'loud', 'announcement'] },

      // Hearts & Emotions
      { icon: '❤️', name: 'heart', keywords: ['heart', 'love', 'favorite'] },
      { icon: '🧡', name: 'orange-heart', keywords: ['heart', 'orange', 'love'] },
      { icon: '💛', name: 'yellow-heart', keywords: ['heart', 'yellow', 'love'] },
      { icon: '💚', name: 'green-heart', keywords: ['heart', 'green', 'love'] },
      { icon: '💙', name: 'blue-heart', keywords: ['heart', 'blue', 'love'] },
      { icon: '💜', name: 'purple-heart', keywords: ['heart', 'purple', 'love'] },
      { icon: '🖤', name: 'black-heart', keywords: ['heart', 'black', 'love'] },
      { icon: '🤍', name: 'white-heart', keywords: ['heart', 'white', 'love'] },
      { icon: '🤎', name: 'brown-heart', keywords: ['heart', 'brown', 'love'] },
      { icon: '💔', name: 'broken-heart', keywords: ['heart', 'broken', 'sad'] },
      { icon: '❣️', name: 'heart-exclamation', keywords: ['heart', 'exclamation', 'love'] },
      { icon: '💕', name: 'two-hearts', keywords: ['hearts', 'two', 'love'] },
      { icon: '💞', name: 'revolving-hearts', keywords: ['hearts', 'revolving', 'love'] },
      { icon: '💓', name: 'beating-heart', keywords: ['heart', 'beating', 'love'] },
      { icon: '💗', name: 'growing-heart', keywords: ['heart', 'growing', 'love'] },
      { icon: '💖', name: 'sparkling-heart', keywords: ['heart', 'sparkling', 'love'] },
      { icon: '💘', name: 'heart-arrow', keywords: ['heart', 'arrow', 'love'] },
      { icon: '💝', name: 'heart-ribbon', keywords: ['heart', 'ribbon', 'gift'] },

      // Circles & Shapes
      { icon: '🔴', name: 'red-circle', keywords: ['red', 'circle', 'dot'] },
      { icon: '🟠', name: 'orange-circle', keywords: ['orange', 'circle', 'dot'] },
      { icon: '🟡', name: 'yellow-circle', keywords: ['yellow', 'circle', 'dot'] },
      { icon: '🟢', name: 'green-circle', keywords: ['green', 'circle', 'dot'] },
      { icon: '🔵', name: 'blue-circle', keywords: ['blue', 'circle', 'dot'] },
      { icon: '🟣', name: 'purple-circle', keywords: ['purple', 'circle', 'dot'] },
      { icon: '🟤', name: 'brown-circle', keywords: ['brown', 'circle', 'dot'] },
      { icon: '⚪', name: 'white-circle', keywords: ['white', 'circle', 'dot'] },
      { icon: '⚫', name: 'black-circle', keywords: ['black', 'circle', 'dot'] },
      { icon: '🟥', name: 'red-square', keywords: ['red', 'square', 'shape'] },
      { icon: '🟧', name: 'orange-square', keywords: ['orange', 'square', 'shape'] },
      { icon: '🟨', name: 'yellow-square', keywords: ['yellow', 'square', 'shape'] },
      { icon: '🟩', name: 'green-square', keywords: ['green', 'square', 'shape'] },
      { icon: '🟦', name: 'blue-square', keywords: ['blue', 'square', 'shape'] },
      { icon: '🟪', name: 'purple-square', keywords: ['purple', 'square', 'shape'] },
      { icon: '🟫', name: 'brown-square', keywords: ['brown', 'square', 'shape'] },
      { icon: '⬜', name: 'white-square', keywords: ['white', 'square', 'shape'] },
      { icon: '⬛', name: 'black-square', keywords: ['black', 'square', 'shape'] },
      { icon: '🔸', name: 'orange-diamond', keywords: ['orange', 'diamond', 'shape'] },
      { icon: '🔹', name: 'blue-diamond', keywords: ['blue', 'diamond', 'shape'] },
      { icon: '🔶', name: 'large-orange-diamond', keywords: ['orange', 'diamond', 'large'] },
      { icon: '🔷', name: 'large-blue-diamond', keywords: ['blue', 'diamond', 'large'] },
      { icon: '🔺', name: 'red-triangle-up', keywords: ['red', 'triangle', 'up'] },
      { icon: '🔻', name: 'red-triangle-down', keywords: ['red', 'triangle', 'down'] },
      { icon: '💠', name: 'diamond-flower', keywords: ['diamond', 'flower', 'shape'] },
      { icon: '🔘', name: 'radio-button', keywords: ['radio', 'button', 'select'] },

      // Arrows & Directions
      { icon: '⬆️', name: 'up-arrow', keywords: ['arrow', 'up', 'direction'] },
      { icon: '⬇️', name: 'down-arrow', keywords: ['arrow', 'down', 'direction'] },
      { icon: '⬅️', name: 'left-arrow', keywords: ['arrow', 'left', 'direction'] },
      { icon: '➡️', name: 'right-arrow', keywords: ['arrow', 'right', 'direction'] },
      { icon: '↗️', name: 'up-right-arrow', keywords: ['arrow', 'up-right', 'direction'] },
      { icon: '↘️', name: 'down-right-arrow', keywords: ['arrow', 'down-right', 'direction'] },
      { icon: '↙️', name: 'down-left-arrow', keywords: ['arrow', 'down-left', 'direction'] },
      { icon: '↖️', name: 'up-left-arrow', keywords: ['arrow', 'up-left', 'direction'] },
      { icon: '↕️', name: 'up-down-arrow', keywords: ['arrow', 'up-down', 'vertical'] },
      { icon: '↔️', name: 'left-right-arrow', keywords: ['arrow', 'left-right', 'horizontal'] },
      { icon: '↩️', name: 'return-left', keywords: ['return', 'left', 'back'] },
      { icon: '↪️', name: 'return-right', keywords: ['return', 'right', 'forward'] },
      { icon: '⤴️', name: 'arrow-curve-up', keywords: ['arrow', 'curve', 'up'] },
      { icon: '⤵️', name: 'arrow-curve-down', keywords: ['arrow', 'curve', 'down'] },
      { icon: '🔃', name: 'clockwise-arrows', keywords: ['arrows', 'clockwise', 'refresh'] },
      { icon: '🔄', name: 'counterclockwise-arrows', keywords: ['arrows', 'counterclockwise', 'refresh'] },
      { icon: '🔙', name: 'back-arrow', keywords: ['back', 'arrow', 'return'] },
      { icon: '🔚', name: 'end-arrow', keywords: ['end', 'arrow', 'finish'] },
      { icon: '🔛', name: 'on-arrow', keywords: ['on', 'arrow', 'activate'] },
      { icon: '🔜', name: 'soon-arrow', keywords: ['soon', 'arrow', 'upcoming'] },
      { icon: '🔝', name: 'top-arrow', keywords: ['top', 'arrow', 'up'] },

      // Stars & Sparkles
      { icon: '⭐', name: 'star', keywords: ['star', 'favorite', 'important'] },
      { icon: '🌟', name: 'star-shine', keywords: ['star', 'shine', 'special'] },
      { icon: '✨', name: 'sparkles', keywords: ['sparkles', 'magic', 'special'] },
      { icon: '💫', name: 'dizzy', keywords: ['dizzy', 'stars', 'spinning'] },
      { icon: '⚡', name: 'lightning', keywords: ['lightning', 'fast', 'energy'] },
      { icon: '🔥', name: 'fire', keywords: ['fire', 'hot', 'flame'] },
      { icon: '💥', name: 'collision', keywords: ['collision', 'boom', 'explosion'] },

      // Weather & Nature
      { icon: '☀️', name: 'sun', keywords: ['sun', 'sunny', 'weather'] },
      { icon: '⭐', name: 'star', keywords: ['star', 'night', 'sky'] },
      { icon: '🌙', name: 'moon', keywords: ['moon', 'night', 'crescent'] },
      { icon: '🌝', name: 'full-moon-face', keywords: ['moon', 'full', 'face'] },
      { icon: '🌞', name: 'sun-face', keywords: ['sun', 'face', 'bright'] },
      { icon: '⛅', name: 'partly-cloudy', keywords: ['cloud', 'sun', 'weather'] },
      { icon: '☁️', name: 'cloud', keywords: ['cloud', 'weather', 'sky'] },
      { icon: '⛈️', name: 'storm', keywords: ['storm', 'thunder', 'weather'] },
      { icon: '🌧️', name: 'rain', keywords: ['rain', 'weather', 'wet'] },
      { icon: '🌩️', name: 'lightning-cloud', keywords: ['lightning', 'cloud', 'storm'] },
      { icon: '⛄', name: 'snowman', keywords: ['snowman', 'snow', 'winter'] },
      { icon: '☃️', name: 'snowman-snow', keywords: ['snowman', 'snow', 'winter'] },
      { icon: '❄️', name: 'snowflake', keywords: ['snowflake', 'snow', 'winter'] },
      { icon: '🌈', name: 'rainbow', keywords: ['rainbow', 'colors', 'weather'] },
      { icon: '🌊', name: 'wave', keywords: ['wave', 'water', 'ocean'] },
      { icon: '💧', name: 'droplet', keywords: ['droplet', 'water', 'drop'] },
      { icon: '💦', name: 'sweat-droplets', keywords: ['droplets', 'sweat', 'water'] },

      // Symbols & Signs
      { icon: '♻️', name: 'recycle', keywords: ['recycle', 'green', 'eco'] },
      { icon: '⚜️', name: 'fleur-de-lis', keywords: ['fleur-de-lis', 'symbol', 'decoration'] },
      { icon: '🔱', name: 'trident', keywords: ['trident', 'symbol', 'emblem'] },
      { icon: '📛', name: 'name-badge', keywords: ['badge', 'name', 'tag'] },
      { icon: '🔰', name: 'beginner', keywords: ['beginner', 'new', 'symbol'] },
      { icon: '⚛️', name: 'atom', keywords: ['atom', 'science', 'physics'] },
      { icon: '🕉️', name: 'om', keywords: ['om', 'symbol', 'religion'] },
      { icon: '✡️', name: 'star-of-david', keywords: ['star', 'david', 'religion'] },
      { icon: '☸️', name: 'wheel-of-dharma', keywords: ['wheel', 'dharma', 'religion'] },
      { icon: '☯️', name: 'yin-yang', keywords: ['yin-yang', 'balance', 'symbol'] },
      { icon: '✝️', name: 'cross', keywords: ['cross', 'christian', 'religion'] },
      { icon: '☦️', name: 'orthodox-cross', keywords: ['cross', 'orthodox', 'religion'] },
      { icon: '☪️', name: 'star-crescent', keywords: ['star', 'crescent', 'islam'] },
      { icon: '☮️', name: 'peace', keywords: ['peace', 'symbol', 'harmony'] },
      { icon: '🕎', name: 'menorah', keywords: ['menorah', 'jewish', 'religion'] },
      { icon: '🔯', name: 'dotted-six-pointed-star', keywords: ['star', 'dotted', 'symbol'] },

      // Misc Common
      { icon: '💡', name: 'lightbulb', keywords: ['lightbulb', 'idea', 'light'] },
      { icon: '🔑', name: 'key', keywords: ['key', 'lock', 'access'] },
      { icon: '🔐', name: 'locked-key', keywords: ['locked', 'key', 'secure'] },
      { icon: '🔒', name: 'locked', keywords: ['locked', 'secure', 'private'] },
      { icon: '🔓', name: 'unlocked', keywords: ['unlocked', 'open', 'access'] },
      { icon: '🔏', name: 'locked-pen', keywords: ['locked', 'pen', 'secure'] },
      { icon: '🎁', name: 'gift', keywords: ['gift', 'present', 'surprise'] },
      { icon: '🎀', name: 'ribbon', keywords: ['ribbon', 'bow', 'decoration'] },
      { icon: '🎈', name: 'balloon', keywords: ['balloon', 'party', 'celebration'] },
      { icon: '🏁', name: 'checkered-flag', keywords: ['flag', 'checkered', 'finish'] },
      { icon: '🚩', name: 'triangular-flag', keywords: ['flag', 'triangular', 'mark'] },
      { icon: '🎌', name: 'crossed-flags', keywords: ['flags', 'crossed', 'celebration'] },
      { icon: '🏴', name: 'black-flag', keywords: ['flag', 'black', 'pirate'] },
      { icon: '🏳️', name: 'white-flag', keywords: ['flag', 'white', 'surrender'] },
      { icon: '🏳️‍🌈', name: 'rainbow-flag', keywords: ['flag', 'rainbow', 'pride'] },
    ],
  },
};

export const IconPicker: React.FC<IconPickerProps> = ({
  value,
  onChange,
  placeholder = 'Select icon...',
  category = 'all',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customIcon, setCustomIcon] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<keyof typeof ICON_CATEGORIES>(
    category === 'all' ? 'calendar' : category
  );

  // Filter icons based on search query
  const filteredIcons = useMemo(() => {
    if (!searchQuery.trim()) {
      return category === 'all'
        ? ICON_CATEGORIES[activeTab].icons
        : ICON_CATEGORIES[category].icons;
    }

    const query = searchQuery.toLowerCase();
    const iconsToSearch = category === 'all'
      ? ICON_CATEGORIES[activeTab].icons
      : ICON_CATEGORIES[category].icons;

    return iconsToSearch.filter(({ name, keywords }) =>
      name.toLowerCase().includes(query) ||
      keywords.some(kw => kw.toLowerCase().includes(query))
    );
  }, [searchQuery, activeTab, category]);

  const handleIconSelect = (icon: string) => {
    onChange(icon);
    setIsOpen(false);
    setCustomIcon('');
    setSearchQuery('');
  };

  const handleCustomIconSubmit = () => {
    if (customIcon.trim()) {
      onChange(customIcon.trim());
      setCustomIcon('');
      setSearchQuery('');
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    onChange(undefined);
    setIsOpen(false);
    setCustomIcon('');
    setSearchQuery('');
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-left flex items-center justify-between bg-white"
      >
        <span className={value ? 'flex items-center gap-2' : 'text-gray-500'}>
          {value ? (
            <>
              <span className="text-2xl">{value}</span>
              <span className="text-sm text-gray-600">{tStatic('common:auto.frontend.k9a976fc228b6')}</span>
            </>
          ) : (
            placeholder
          )}
        </span>
        <span className="text-gray-400">▾</span>
      </button>

      {/* Dropdown Panel - VERY HIGH Z-INDEX for modal compatibility */}
      {isOpen && (
        <>
          {/* Backdrop with very high z-index */}
          <div
            className="fixed inset-0 z-[99998]"
            onClick={() => {
              setIsOpen(false);
              setSearchQuery('');
            }}
          />

          {/* Picker Panel with highest possible z-index */}
          <div className="fixed w-full md:w-96 bg-white rounded-xl shadow-2xl border-2 border-gray-200 z-[99999] flex flex-col"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              maxWidth: '24rem',
              maxHeight: '80vh'
            }}
          >
            {/* Search Bar */}
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tStatic('common:auto.frontend.k2f149aaf731c')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>

            {/* Header with Tabs (if showing all categories) */}
            {category === 'all' && !searchQuery && (
              <div className="flex border-b border-gray-200 overflow-x-auto">
                {Object.entries(ICON_CATEGORIES).map(([key, cat]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key as keyof typeof ICON_CATEGORIES)}
                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-all ${
                      activeTab === key
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}

            {/* Icon Grid */}
            <div className="p-4 overflow-y-auto flex-1">
              {filteredIcons.length > 0 ? (
                <div className="grid grid-cols-8 gap-2">
                  {filteredIcons.map(({ icon, name }, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleIconSelect(icon)}
                      className={`p-2 text-2xl rounded-lg transition-all duration-200 hover:bg-blue-50 hover:scale-110 ${
                        value === icon ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:shadow-md'
                      }`}
                      title={name}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">{tStatic('common:auto.frontend.k7d005a7b9492')}{searchQuery}"</p>
                  <p className="text-xs mt-2">{tStatic('common:auto.frontend.k39d6420eaad6')}</p>
                </div>
              )}
            </div>

            {/* Custom Icon Input */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customIcon}
                  onChange={(e) => setCustomIcon(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCustomIconSubmit()}
                  placeholder={tStatic('common:auto.frontend.k7f3d0ba4d3c9')}
                  maxLength={10}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleCustomIconSubmit}
                  disabled={!customIcon.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {tStatic('common:auto.frontend.k61cc55aa0453')}</button>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-3 border-t border-gray-200 flex justify-between gap-2">
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              >
                {tStatic('common:auto.frontend.k719ea396ad92')}</button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setSearchQuery('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
              >
                {tStatic('common:auto.frontend.kbbfa773e5a63')}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
