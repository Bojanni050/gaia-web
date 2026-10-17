import {
  buildResearchJobsRequest,
  buildResearchAckRequest,
  buildResearchApprovalRequest,
  parseResearchJobs,
} from './contract';

// The research queue is the one place the web client learns about work Gaia put
// out at Hermes: the turn is answered immediately, the findings are written into
// the conversation by the server, and this contract only carries the asks.

describe('research contract', () => {
  it('asks for the queue', () => {
    expect(buildResearchJobsRequest()).toEqual({ method: 'get', path: '/research/jobs' });
  });

  it('acknowledges a delivered job by its id', () => {
    expect(buildResearchAckRequest('r-1')).toEqual({ method: 'post', path: '/research/jobs/r-1/ack' });
  });

  it('escapes the id rather than trusting it in a path', () => {
    expect(buildResearchAckRequest('a/b c').path).toBe('/research/jobs/a%2Fb%20c/ack');
  });

  it('answers an approval with the choice the server itself offered', () => {
    expect(buildResearchApprovalRequest('r-2', 'once')).toEqual({
      method: 'post',
      path: '/research/jobs/r-2/approval',
      body: { choice: 'once' },
    });
  });

  it('sends no body when there is no choice', () => {
    expect(buildResearchApprovalRequest('r-2', null)).toEqual({
      method: 'post',
      path: '/research/jobs/r-2/approval',
    });
  });

  it('reads the three buckets the queue comes in', () => {
    const running = [{ id: 'r-1', status: 'running' }];
    const awaiting = [{ id: 'r-2', status: 'awaiting_approval' }];
    const finished = [{ id: 'r-3', status: 'done' }];

    expect(parseResearchJobs({ running, awaiting, finished })).toEqual({ running, awaiting, finished });
  });

  it('degrades an empty or malformed body to empty buckets instead of throwing', () => {
    expect(parseResearchJobs(undefined)).toEqual({ running: [], awaiting: [], finished: [] });
    expect(parseResearchJobs({ running: null, awaiting: 'nope' })).toEqual({
      running: [],
      awaiting: [],
      finished: [],
    });
  });
});
