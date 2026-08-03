insert into tasks (id, name, icon) values ('t-1', 'Empfang', 'People');
insert into tasks (id, name, icon) values ('t-2', 'Labor', 'Laboratory');
insert into tasks (id, name, icon) values ('t-3', 'Telefon', 'Phone');
insert into tasks (id, name, icon) values ('t-4', 'Mails', 'Email');


insert into shifts (id, name, color, times) values ('s-1', 'Frühdienst', '#f53eab', '[{ "from": "07:00", "to": "12:30" }, { "from": "13:00", "to": "15:00" }]'::jsonb);
insert into shifts (id, name, color, times) values ('s-2', 'Geteilter Dienst', '#f56e00', '[{ "from": "07:45", "to": "12:00" }, { "from": "14:00", "to": "18:00" }]'::jsonb);
insert into shifts (id, name, color, times) values ('s-3', 'Mitteldienst', '#414cdd', '[{ "from": "08:00", "to": "12:30" }, { "from": "13:00", "to": "16:00" }]'::jsonb);
insert into shifts (id, name, color, times) values ('s-4', 'Spätdienst', '#f1dd24', '[{ "from": "12:30", "to": "21:30" }]'::jsonb);
insert into shifts (id, name, color, times) values ('s-5', 'Morgen', '#8ace4b', '[{ "from": "07:45", "to": "14:00" }]'::jsonb);
insert into shifts (id, name, color, times) values ('s-6', 'Nachmittag', '#55cec8', '[{ "from": "14:00", "to": "18:00" }]'::jsonb);
insert into shifts (id, name, color, times) values ('s-7', 'Ferien / Abwesend', '#757575', '[]'::jsonb);
