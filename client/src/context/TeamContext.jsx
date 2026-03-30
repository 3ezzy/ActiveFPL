import { createContext, useContext, useState } from 'react';

const TeamContext = createContext();

export function TeamProvider({ children }) {
  const [teamId, setTeamId] = useState(
    () => localStorage.getItem('fpl_team_id') || ''
  );

  const updateTeamId = (id) => {
    localStorage.setItem('fpl_team_id', id);
    setTeamId(id);
  };

  return (
    <TeamContext.Provider value={{ teamId, setTeamId: updateTeamId }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  return useContext(TeamContext);
}
