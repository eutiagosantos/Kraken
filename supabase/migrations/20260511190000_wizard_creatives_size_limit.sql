update storage.buckets
set file_size_limit = 536870912000  -- 500 GB (máximo no plano Pro/Team)
where id = 'wizard_creatives';
