/*
Copyright (C) 2017  Cloudbase Solutions SRL
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.
You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

// @flow

import React from 'react'
import { observer } from 'mobx-react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

import StatusImage from '../../../../atoms/StatusImage'

import Palette from '../../../../styleUtils/Palette'
import StyleProps from '../../../../styleUtils/StyleProps'

const Wrapper = styled.div`
  background: ${Palette.grayscale[0]};
  display: flex;
  overflow: auto;
  border-radius: ${StyleProps.borderRadius};
`
const CountBlock = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 32px 0;
  padding: 0 16px;
  border-left: 1px solid white;
  height: 96px;
  justify-content: center;
  &:first-child {
    border-left: 1px solid ${Palette.grayscale[0]};
  }

  @media (max-width: 832px) {
    align-items: flex-start;
  }
`
const LoadingWrapper = styled.div`
  overflow: hidden;
  margin-bottom: 16px;
`
const CountBlockValue = styled(Link)`
  font-size: 53px;
  font-weight: ${StyleProps.fontWeights.extraLight};
  text-decoration: none;
  color: inherit;
`
const CountBlockLabel = styled(Link)`
  font-size: 12px;
  font-weight: ${StyleProps.fontWeights.medium};
  text-transform: uppercase;
  color: ${props => props.color};
  text-decoration: none;
`
type Props = {
  data: {
    label: string,
    value: number,
    color: string,
    link: string,
    loading: boolean,
  }[],
}
@observer
class InfoCountModule extends React.Component<Props> {
  render() {
    return (
      <Wrapper>
        {this.props.data.map(item => (
          <CountBlock key={item.label}>
            {
              !item.value && item.loading ? <LoadingWrapper><StatusImage status="RUNNING" size={48} /></LoadingWrapper>
                : <CountBlockValue to={item.link}>{item.value}</CountBlockValue>
            }
            <CountBlockLabel color={item.color} to={item.link}>{item.label}</CountBlockLabel>
          </CountBlock>
        ))}
      </Wrapper>
    )
  }
}

export default InfoCountModule
