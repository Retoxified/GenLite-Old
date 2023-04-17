export class BoostDepletion {
  public static readonly selectorSkillContainer = '.new_ux-player-info-modal__modal__window--stats__skill__container';

  audioBoostExpired;
  intervalExpirationCheck;
  intervalExpirationCheckMilliseconds = 250;

  public init() {
    this.audioBoostExpired = new Audio('https://furious.no/downloads/genfanad/bell.wav');
  }

  enable() {
    if (this.intervalExpirationCheck !== undefined) {
      clearInterval(this.intervalExpirationCheck);
    }

    let state = this.loadState();
    this.intervalExpirationCheck = setInterval(() => {
      const newState = this.loadState();

      let foundAnyExpiredBoost = false;
      for (const stateKey of Object.keys(newState)) {
        if (!state[stateKey]) {
          state = this.loadState();
        }

        const stateValuesNew = newState[stateKey];
        const stateValuesOld = state[stateKey];

        if (stateValuesNew.stat < stateValuesOld.stat) {
          if (stateValuesNew.stat === stateValuesNew.maxStat) {
            foundAnyExpiredBoost = true;
            break;
          }
        }

      }

      if (foundAnyExpiredBoost) {
        this.audioBoostExpired?.play();
      }

      state = newState;
    }, 250);
  }

  disable() {
    if (this.intervalExpirationCheck !== undefined) {
      clearInterval(this.intervalExpirationCheck);
    }
  }

  loadState() {
    const skillStatus = this.getSkillStatus();

    const previousStatusByKey = {};

    for (const skill of skillStatus) {
      const name = skill?.children?.[1].innerText;
      const status = skill?.children?.[2].innerText;

      if (!name || !status) {
        continue;
      }

      const statusSplit = status.split('/');
      const stat = Number(statusSplit[0]);
      const maxStat = Number(statusSplit[1]);

      previousStatusByKey[name] = { stat, maxStat };
    }

    return previousStatusByKey;
  }

  getSkillStatus() {
    const skills: any = document.querySelectorAll(BoostDepletion.selectorSkillContainer);

    const skillsToSelect = [
      'Strength',
      'Defense',
    ];

    const selectedSkillsByKey = {};

    const selectedSkills = [];

    for (const skill of skills) {
      for (const skillToSelect of skillsToSelect) {
        if (skill?.innerText?.includes(skillToSelect) && !selectedSkillsByKey[skillToSelect]) {
          selectedSkillsByKey[skillToSelect] = true;
          selectedSkills.push(skill);
        }
      }
    }

    return selectedSkills;
  }
}
