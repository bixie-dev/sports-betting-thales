import SPAAnchor from 'components/SPAAnchor';
import TimeRemaining from 'components/TimeRemaining';
import Tooltip from 'components/Tooltip';
import { ENETPULSE_SPORTS, FIFA_WC_TAG, FIFA_WC_U20_TAG, JSON_ODDS_SPORTS, SPORTS_TAGS_MAP } from 'constants/tags';
import { BetType } from 'enums/markets';
import useEnetpulseAdditionalDataQuery from 'queries/markets/useEnetpulseAdditionalDataQuery';
import useJsonOddsAdditionalDataQuery from 'queries/markets/useJsonOddsAdditionalDataQuery';
import useSportMarketLiveResultQuery from 'queries/markets/useSportMarketLiveResultQuery';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { getIsAppReady, getIsMobile } from 'redux/modules/app';
import { RootState } from 'redux/rootReducer';
import { formatShortDateWithTime } from 'thales-utils';
import { SportMarketInfo, SportMarketLiveResult } from 'types/markets';
import { fixOneSideMarketCompetitorName } from 'utils/formatters/string';
import { getOnImageError, getTeamImageSource } from 'utils/images';
import { isFifaWCGame, isGolf, isIIHFWCGame, isMotosport, isPlayerProps, isUEFAGame } from 'utils/markets';
import { buildMarketLink } from 'utils/routes';
import Web3 from 'web3';
import CombinedMarketsOdds from './components/CombinedMarketsOdds';
import MatchStatus from './components/MatchStatus';
import Odds from './components/Odds';
import PlayerPropsOdds from './components/PlayerPropsOdds/PlayerPropsOdds';
import {
    Arrow,
    ClubLogo,
    MainContainer,
    MatchInfoConatiner,
    MatchTimeLabel,
    OddsWrapper,
    PlayerPropsLabel,
    Result,
    ResultLabel,
    ResultWrapper,
    SecondRowContainer,
    TeamLogosConatiner,
    TeamNameLabel,
    TeamNamesConatiner,
    TeamsInfoConatiner,
    ThirdRowContainer,
    TotalMarkets,
    TotalMarketsArrow,
    TotalMarketsContainer,
    TotalMarketsLabel,
    TotalMarketsWrapper,
    VSLabel,
    Wrapper,
} from './styled-components';

// 3 for double chance, 1 for spread, 1 for total
const MAX_NUMBER_OF_CHILD_MARKETS_ON_CONTRACT = 5;
// 1 for winner, 1 for double chance, 1 for spread, 1 for total
// const MAX_NUMBER_OF_MARKETS = 4;

type MarketRowCardProps = {
    market: SportMarketInfo;
    language: string;
};

const MarketListCard: React.FC<MarketRowCardProps> = ({ market, language }) => {
    const { t } = useTranslation();
    const isAppReady = useSelector((state: RootState) => getIsAppReady(state));
    const isMobile = useSelector((state: RootState) => getIsMobile(state));
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const [homeLogoSrc, setHomeLogoSrc] = useState(getTeamImageSource(market.homeTeam, market.tags[0]));
    const [awayLogoSrc, setAwayLogoSrc] = useState(getTeamImageSource(market.awayTeam, market.tags[0]));

    const [liveResultInfo, setLiveResultInfo] = useState<SportMarketLiveResult | undefined>(undefined);

    useEffect(() => {
        setHomeLogoSrc(getTeamImageSource(market.homeTeam, market.tags[0]));
        setAwayLogoSrc(getTeamImageSource(market.awayTeam, market.tags[0]));
    }, [market.homeTeam, market.awayTeam, market.tags]);

    const isGameStarted = market.maturityDate < new Date();
    const isGameResolved = market.isResolved || market.isCanceled;
    const isGameRegularlyResolved = market.isResolved && !market.isCanceled;
    const isPendingResolution = isGameStarted && !isGameResolved;
    const showOdds = !isPendingResolution && !isGameResolved && !market.isPaused;
    const isEnetpulseSport = ENETPULSE_SPORTS.includes(Number(market.tags[0]));
    const isJsonOddsSport = JSON_ODDS_SPORTS.includes(Number(market.tags[0]));
    const gameIdString = Web3.utils.hexToAscii(market.gameId);
    const gameDate = new Date(market.maturityDate).toISOString().split('T')[0];

    const combinedMarketPositions = market.combinedMarketsData ? market.combinedMarketsData : [];

    const doubleChanceMarkets = market.childMarkets.filter((market) => market.betType === BetType.DOUBLE_CHANCE);
    const spreadTotalMarkets = market.childMarkets.filter(
        (market) => market.betType === BetType.SPREAD || market.betType === BetType.TOTAL
    );
    const playerPropsMarkets = market.childMarkets.filter((market) => isPlayerProps(market.betType));

    const hasChildMarkets =
        doubleChanceMarkets.length > 0 || spreadTotalMarkets.length > 0 || playerPropsMarkets.length > 0;
    const hasCombinedMarkets = market.combinedMarketsData ? true : false;
    const hasPlayerPropsMarkets = playerPropsMarkets.length > 0;
    const MAX_NUMBER_OF_MARKETS_COUNT =
        doubleChanceMarkets.length + playerPropsMarkets.length + combinedMarketPositions.length;
    const isMaxNumberOfChildMarkets =
        market.childMarkets.length === MAX_NUMBER_OF_CHILD_MARKETS_ON_CONTRACT ||
        market.childMarkets.length + combinedMarketPositions.length >= MAX_NUMBER_OF_CHILD_MARKETS_ON_CONTRACT;
    const showSecondRowOnDesktop = !isMobile && (isMaxNumberOfChildMarkets || hasPlayerPropsMarkets);
    const showSecondRowOnMobile = isMobile && hasChildMarkets;

    const showOnlyCombinedPositionsInSecondRow =
        showSecondRowOnDesktop && !isMobile && !doubleChanceMarkets.length && combinedMarketPositions.length > 0;

    const useLiveResultQuery = useSportMarketLiveResultQuery(gameIdString, {
        enabled: isAppReady && isPendingResolution && !isEnetpulseSport && !isJsonOddsSport,
    });

    const useEnetpulseLiveResultQuery = useEnetpulseAdditionalDataQuery(gameIdString, gameDate, market.tags[0], {
        enabled: isAppReady && isEnetpulseSport && (isPendingResolution || !localStorage.getItem(market.address)),
    });

    const useJsonDataAdditionalInfoQuery = useJsonOddsAdditionalDataQuery(gameIdString, market.tags[0], {
        enabled: isAppReady && isJsonOddsSport && (isPendingResolution || !localStorage.getItem(market.address)),
    });

    useEffect(() => {
        if (isEnetpulseSport) {
            if (useEnetpulseLiveResultQuery.isSuccess && useEnetpulseLiveResultQuery.data) {
                setLiveResultInfo(useEnetpulseLiveResultQuery.data);
                const tournamentName = useEnetpulseLiveResultQuery.data.tournamentName
                    ? market.isOneSideMarket
                        ? useEnetpulseLiveResultQuery.data.tournamentName
                        : '| ' + useEnetpulseLiveResultQuery.data.tournamentName
                    : '';
                const tournamentRound = useEnetpulseLiveResultQuery.data.tournamentRound
                    ? ' | ' + useEnetpulseLiveResultQuery.data.tournamentRound
                    : '';
                localStorage.setItem(market.address, tournamentName + tournamentRound);
            }
        } else if (isJsonOddsSport) {
            if (useJsonDataAdditionalInfoQuery.isSuccess && useJsonDataAdditionalInfoQuery.data) {
                const tournamentName = useJsonDataAdditionalInfoQuery.data;
                localStorage.setItem(market.address, tournamentName);
            }
        } else {
            if (useLiveResultQuery.isSuccess && useLiveResultQuery.data) {
                setLiveResultInfo(useLiveResultQuery.data);
            }
        }
    }, [
        useLiveResultQuery,
        useLiveResultQuery.data,
        useEnetpulseLiveResultQuery,
        useEnetpulseLiveResultQuery.data,
        isEnetpulseSport,
        market.isOneSideMarket,
        market.address,
        useJsonDataAdditionalInfoQuery,
        useJsonDataAdditionalInfoQuery.data,
        isJsonOddsSport,
    ]);

    const areDoubleChanceMarketsOddsValid =
        doubleChanceMarkets && doubleChanceMarkets.length > 0
            ? doubleChanceMarkets.map((item) => item.homeOdds).every((odd) => odd < 1 && odd != 0)
            : false;

    const areSpreadTotalsMarketsOddsValid =
        spreadTotalMarkets && spreadTotalMarkets.length > 0
            ? spreadTotalMarkets
                  .map((item) => [item.homeOdds, item.awayOdds])
                  .every((oddsArray) => oddsArray[0] < 1 && oddsArray[0] != 0 && oddsArray[1] < 1 && oddsArray[1] != 0)
            : false;

    const areOddsValid = market.drawOdds
        ? [market.homeOdds, market.awayOdds, market.drawOdds].every((odd) => odd < 1 && odd != 0)
        : [market.homeOdds, market.awayOdds].every((odd) => odd < 1 && odd != 0);

    const hideGame =
        !areDoubleChanceMarketsOddsValid &&
        !areSpreadTotalsMarketsOddsValid &&
        !areOddsValid &&
        !isMotosport(Number(market.tags[0])) &&
        !isGolf(Number(market.tags[0])) &&
        showOdds;

    return (
        <Wrapper hideGame={hideGame} isResolved={isGameRegularlyResolved}>
            <MainContainer>
                <MatchInfoConatiner>
                    <SPAAnchor
                        href={buildMarketLink(
                            market.address,
                            language,
                            false,
                            encodeURIComponent(`${market.homeTeam} vs ${market.awayTeam}`)
                        )}
                    >
                        <Tooltip
                            overlay={
                                <>
                                    {t(`markets.market-card.starts-in`)}:{' '}
                                    <TimeRemaining end={market.maturityDate} fontSize={11} />
                                </>
                            }
                            component={<MatchTimeLabel>{formatShortDateWithTime(market.maturityDate)} </MatchTimeLabel>}
                        />
                        {isFifaWCGame(market.tags[0]) && (
                            <Tooltip overlay={t(`common.fifa-tooltip`)} iconFontSize={12} marginLeft={2} />
                        )}
                        {isIIHFWCGame(market.tags[0]) && (
                            <Tooltip overlay={t(`common.iihf-tooltip`)} iconFontSize={12} marginLeft={2} />
                        )}
                        {isUEFAGame(Number(market.tags[0])) && (
                            <Tooltip overlay={t(`common.football-tooltip`)} iconFontSize={12} marginLeft={2} />
                        )}
                        <MatchTimeLabel>
                            {(isEnetpulseSport || isJsonOddsSport) &&
                            !isFifaWCGame(market.tags[0]) &&
                            !isUEFAGame(Number(market.tags[0])) &&
                            (liveResultInfo || localStorage.getItem(market.address)) ? (
                                <>
                                    {localStorage.getItem(market.address)}
                                    {SPORTS_TAGS_MAP['Tennis'].includes(Number(market.tags[0])) && (
                                        <Tooltip
                                            overlay={t(`common.tennis-tooltip`)}
                                            iconFontSize={12}
                                            marginLeft={2}
                                        />
                                    )}
                                </>
                            ) : (
                                ''
                            )}
                        </MatchTimeLabel>
                        <TeamsInfoConatiner>
                            <TeamLogosConatiner>
                                <ClubLogo
                                    height={
                                        market.tags[0] == FIFA_WC_TAG || market.tags[0] == FIFA_WC_U20_TAG ? '17px' : ''
                                    }
                                    width={
                                        market.tags[0] == FIFA_WC_TAG || market.tags[0] == FIFA_WC_U20_TAG ? '27px' : ''
                                    }
                                    alt="Home team logo"
                                    src={homeLogoSrc}
                                    onError={getOnImageError(setHomeLogoSrc, market.tags[0])}
                                />
                                {!market.isOneSideMarket && (
                                    <>
                                        <VSLabel>VS</VSLabel>
                                        <ClubLogo
                                            height={
                                                market.tags[0] == FIFA_WC_TAG || market.tags[0] == FIFA_WC_U20_TAG
                                                    ? '17px'
                                                    : ''
                                            }
                                            width={
                                                market.tags[0] == FIFA_WC_TAG || market.tags[0] == FIFA_WC_U20_TAG
                                                    ? '27px'
                                                    : ''
                                            }
                                            alt="Away team logo"
                                            src={awayLogoSrc}
                                            onError={getOnImageError(setAwayLogoSrc, market.tags[0])}
                                        />
                                    </>
                                )}
                            </TeamLogosConatiner>
                            <TeamNamesConatiner>
                                <TeamNameLabel>
                                    {market.isOneSideMarket
                                        ? fixOneSideMarketCompetitorName(market.homeTeam)
                                        : market.homeTeam}
                                </TeamNameLabel>
                                {!market.isOneSideMarket && <TeamNameLabel>{market.awayTeam}</TeamNameLabel>}
                            </TeamNamesConatiner>
                        </TeamsInfoConatiner>
                    </SPAAnchor>
                </MatchInfoConatiner>
                <OddsWrapper>
                    {showOdds && (
                        <>
                            <Odds market={market} />
                            {!isMobile && (
                                <>
                                    {doubleChanceMarkets.length > 0 && (
                                        <Odds
                                            market={doubleChanceMarkets[0]}
                                            doubleChanceMarkets={doubleChanceMarkets}
                                        />
                                    )}
                                    {!showSecondRowOnDesktop &&
                                        spreadTotalMarkets.map((childMarket) => (
                                            <Odds market={childMarket} key={childMarket.address} />
                                        ))}
                                    {showOnlyCombinedPositionsInSecondRow &&
                                        spreadTotalMarkets.map((childMarket) => (
                                            <Odds market={childMarket} key={childMarket.address} />
                                        ))}
                                </>
                            )}
                            {showSecondRowOnMobile && (
                                <Arrow
                                    className={isExpanded ? 'icon icon--arrow-up' : 'icon icon--arrow-down'}
                                    onClick={() => setIsExpanded(!isExpanded)}
                                />
                            )}
                            {showSecondRowOnDesktop && (
                                <TotalMarketsWrapper>
                                    {hasPlayerPropsMarkets && (
                                        <PlayerPropsLabel>{t('markets.market-card.player-props')}</PlayerPropsLabel>
                                    )}
                                    <TotalMarketsContainer>
                                        <TotalMarketsLabel>{t('markets.market-card.total-markets')}</TotalMarketsLabel>
                                        <TotalMarkets>{MAX_NUMBER_OF_MARKETS_COUNT}</TotalMarkets>
                                        <TotalMarketsArrow
                                            className={isExpanded ? 'icon icon--arrow-up' : 'icon icon--arrow-down'}
                                            onClick={() => setIsExpanded(!isExpanded)}
                                        />
                                    </TotalMarketsContainer>
                                </TotalMarketsWrapper>
                            )}
                        </>
                    )}
                </OddsWrapper>
                {isGameRegularlyResolved ? (
                    <ResultWrapper>
                        <ResultLabel>
                            {!market.isOneSideMarket ? `${t('markets.market-card.result')}:` : ''}
                        </ResultLabel>
                        <Result>
                            {market.isOneSideMarket
                                ? market.homeScore == 1
                                    ? t('markets.market-card.race-winner')
                                    : t('markets.market-card.no-win')
                                : Number(market.tags[0]) != 9007
                                ? `${market.homeScore} - ${market.awayScore}`
                                : ''}
                            {Number(market.tags[0]) == 9007 ? (
                                <>
                                    {Number(market.homeScore) > 0
                                        ? `W - L (R${market.homeScore})`
                                        : `L - W (R${market.awayScore})`}
                                </>
                            ) : (
                                ''
                            )}
                        </Result>
                    </ResultWrapper>
                ) : (
                    <MatchStatus
                        isPendingResolution={isPendingResolution}
                        liveResultInfo={liveResultInfo}
                        isCanceled={market.isCanceled}
                        isPaused={market.isPaused}
                        isEnetpulseSport={isEnetpulseSport}
                        isJsonOddsSport={isJsonOddsSport}
                    />
                )}
            </MainContainer>
            {(showSecondRowOnMobile || showSecondRowOnDesktop) && showOdds && isExpanded && (
                <>
                    <SecondRowContainer mobilePaddingRight={isMaxNumberOfChildMarkets ? 4 : 20}>
                        <OddsWrapper>
                            {isMobile && doubleChanceMarkets.length > 0 && (
                                <Odds
                                    market={doubleChanceMarkets[0]}
                                    doubleChanceMarkets={doubleChanceMarkets}
                                    isShownInSecondRow
                                />
                            )}
                            {!showOnlyCombinedPositionsInSecondRow &&
                                spreadTotalMarkets.map((childMarket) => (
                                    <Odds market={childMarket} key={childMarket.address} isShownInSecondRow />
                                ))}
                            {hasCombinedMarkets && !isMobile && showOnlyCombinedPositionsInSecondRow && (
                                <CombinedMarketsOdds market={market} isShownInSecondRow />
                            )}
                        </OddsWrapper>
                    </SecondRowContainer>
                    {isMobile && hasCombinedMarkets && (
                        <ThirdRowContainer mobilePaddingRight={isMaxNumberOfChildMarkets ? 4 : 20}>
                            <OddsWrapper>
                                <CombinedMarketsOdds market={market} isShownInSecondRow />
                            </OddsWrapper>
                        </ThirdRowContainer>
                    )}
                    {!isMobile && hasCombinedMarkets && doubleChanceMarkets.length > 0 && (
                        <ThirdRowContainer mobilePaddingRight={isMaxNumberOfChildMarkets ? 4 : 20}>
                            <OddsWrapper>
                                <CombinedMarketsOdds market={market} isShownInSecondRow />
                            </OddsWrapper>
                        </ThirdRowContainer>
                    )}
                    {hasPlayerPropsMarkets && <PlayerPropsOdds markets={playerPropsMarkets} />}
                </>
            )}
        </Wrapper>
    );
};

export default MarketListCard;
