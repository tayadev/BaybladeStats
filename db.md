# Players
- id: UUID
- username: String
- challonge_user_id: String (Nullable)

# Seasons
- id: UUID
- name: String
- start_date: Timestamp
- end_date: Timestamp

# Player_Seasons
- id: UUID
- player_id: UUID (References Players.id)
- season_id: UUID (References Seasons.id)

# Tournaments
- id: UUID
- season_id: UUID (References Seasons.id)
- name: String
- date: Timestamp
- location: String (Nullable)
- winner_id: UUID (References Players.id)
- further details about the way the matches were set up (swiss, double elimination) and the seeding/pairings used

# Matches
- id: UUID
- date: Timestamp // when the match ended
- season_id: UUID (References Seasons.id)
- tournament_id: UUID (References Tournaments.id, Nullable)
- winner_id: UUID (References Players.id)
- loser_id: UUID (References Players.id)