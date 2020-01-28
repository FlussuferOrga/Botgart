-- fallen structures
WITH 
mo AS(
    SELECT 
        mo.*,
        ms.timestamp AS snapshot_timestamp
    FROM 
        matchup_objectives AS mo 
        JOIN objectives_snapshots AS ms 
          ON mo.snapshot_id = ms.objectives_snapshot_id
-- WHERE 
--     ms.timestamp BETWEEN '2020-01-05 10:00:00' AND '2020-01-06 23:59:99'
)
SELECT 
    old.matchup_objective_id,
    old.matchup_id,
    old.objective_id,
    old.map,
    old.type,
    old.snapshot_id          AS old_snapshot_id,
    old.owner                AS old_owner,
    old.points_tick          AS old_points_tick,
    old.points_capture       AS old_points_capture,
    old.last_flipped         AS old_last_flipped,  
    old.yaks_delivered       AS old_yaks,
    old.tier                 AS old_tier,
    new.snapshot_id          AS new_snapshot_id,   
    new.owner                AS new_owner,
    new.points_tick          AS new_points_tick,
    new.points_capture       AS new_points_capture,
    new.last_flipped         AS new_last_flipped    
FROM 
    mo AS old
    JOIN mo AS new
      ON old.objective_id = new.objective_id
         AND old.snapshot_id = new.snapshot_id - 1
         AND old.owner != new.owner
         AND old.matchup_id = new.matchup_id         
ORDER BY 
    new_last_flipped DESC
;