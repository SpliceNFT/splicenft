import ora from 'ora';

const spinner = ora({
  discardStdin: false,
  spinner: 'monkey'
});

export default spinner;
